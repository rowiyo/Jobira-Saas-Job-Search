// pages/api/search/manual.js - Manual search API endpoint
const { createServerSupabaseClient } = require('@supabase/auth-helpers-nextjs');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });
  
  // Get user session (you can comment this out for testing without auth)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized - please log in' });
  }

  const { 
    jobTitle, 
    location, 
    locationType, 
    salaryMin, 
    salaryMax, 
    experienceLevel,
    keywords 
  } = req.body;

  // Validate required fields
  if (!jobTitle || !location) {
    return res.status(400).json({ 
      message: 'Missing required fields: jobTitle and location are required' 
    });
  }

  try {
    console.log('🔍 Creating manual search record...');
    
    // Create manual search record in database
    const { data: search, error: searchError } = await supabase
      .from('job_searches')
      .insert({
        user_id: session.user.id,
        search_type: 'manual',
        job_title: jobTitle,
        location: location,
        location_type: locationType || 'any',
        salary_min: salaryMin || null,
        salary_max: salaryMax || null,
        experience_level: experienceLevel || null,
        search_keywords: keywords || [],
        status: 'pending'
      })
      .select()
      .single();

    if (searchError) {
      console.error('❌ Database error:', searchError);
      throw searchError;
    }

    console.log('✅ Search record created:', search.id);

    // Trigger job scraping (async - don't wait for completion)
    const scrapingPayload = {
      searchId: search.id,
      searchParams: {
        jobTitle,
        location,
        locationType: locationType || 'any',
        salaryMin,
        salaryMax,
        experienceLevel,
        keywords: keywords || []
      }
    };

    // Call the scraper API
    try {
      // Use the full URL for the API call
      const scrapingResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/scrape-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scrapingPayload)
      });

      if (!scrapingResponse.ok) {
        console.error('❌ Scraping API failed:', scrapingResponse.status);
        // Don't throw error - let the search record exist even if scraping fails
      } else {
        console.log('✅ Scraping job started successfully');
      }
    } catch (scrapingError) {
      console.error('❌ Failed to start scraping:', scrapingError);
      // Update search status to indicate scraping failed to start
      await supabase
        .from('job_searches')
        .update({ status: 'failed' })
        .eq('id', search.id);
    }

    // Return search ID immediately (don't wait for scraping to complete)
    res.status(200).json({ 
      searchId: search.id,
      message: 'Search started successfully',
      status: 'pending'
    });

  } catch (error) {
    console.error('❌ Manual search error:', error);
    res.status(500).json({ 
      message: 'Failed to create search',
      error: error.message 
    });
  }
}