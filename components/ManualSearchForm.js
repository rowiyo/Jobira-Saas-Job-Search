// pages/api/search/[searchId].js - Get search results API endpoint
const { createServerSupabaseClient } = require('@supabase/auth-helpers-nextjs');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { searchId } = req.query;
  const supabase = createServerSupabaseClient({ req, res });
  
  // Get user session (comment out for testing without auth)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!searchId) {
    return res.status(400).json({ message: 'Missing searchId parameter' });
  }

  try {
    // Get search details
    const { data: search, error: searchError } = await supabase
      .from('job_searches')
      .select('*')
      .eq('id', searchId)
      .eq('user_id', session.user.id) // Ensure user owns this search
      .single();

    if (searchError || !search) {
      return res.status(404).json({ message: 'Search not found' });
    }

    // Get job results for this search
    const { data: jobResults, error: resultsError } = await supabase
      .from('job_search_results')
      .select('*')
      .eq('search_id', searchId)
      .order('relevance_score', { ascending: false })
      .order('scraped_at', { ascending: false });

    if (resultsError) {
      console.error('❌ Error fetching results:', resultsError);
      throw resultsError;
    }

    // Group results by job board for summary
    const resultsByBoard = {};
    jobResults.forEach(job => {
      if (!resultsByBoard[job.job_board]) {
        resultsByBoard[job.job_board] = [];
      }
      resultsByBoard[job.job_board].push(job);
    });

    const summary = Object.keys(resultsByBoard).map(board => ({
      jobBoard: board,
      count: resultsByBoard[board].length,
      latestScrapedAt: resultsByBoard[board][0]?.scraped_at || null
    }));

    res.status(200).json({
      search: {
        id: search.id,
        jobTitle: search.job_title,
        location: search.location,
        locationType: search.location_type,
        status: search.status,
        totalResults: search.total_results,
        searchDate: search.search_date,
        keywords: search.search_keywords
      },
      summary,
      jobs: jobResults,
      totalJobs: jobResults.length
    });

  } catch (error) {
    console.error('❌ Search results error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch search results',
      error: error.message 
    });
  }
}