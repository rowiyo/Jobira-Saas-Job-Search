import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { searchGlassdoor } from '@/lib/glassdoor-scraper'
import { detectAndMergeDuplicates } from '@/utils/duplicateDetection' 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting job search...')
    
    const body = await request.json()
    console.log('🔍 RECEIVED BODY:', JSON.stringify(body, null, 2))
    const { userId, searchType, searchParams } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    console.log('📋 Job search params:', { userId, searchType, searchParams })

    // Accept both 'manual' and 'resume' search types
    if (searchType === 'manual' || searchType === 'resume') {
      console.log('🔍 Search requested:', { searchType, searchParams })
      
      let jobKeywords: string[] = []
      let searchJobTitle = searchParams.jobTitle
      let searchLocation = searchParams.location
      
      // If it's a resume search, fetch the AI-extracted keywords
      if (searchType === 'resume' && body.resumeId) {
        console.log('📄 Resume search - fetching extracted keywords for resume:', body.resumeId)
        
        // Fetch the resume with extracted keywords
        const { data: resume, error: resumeError } = await supabaseAdmin
          .from('resumes')
          .select('extracted_keywords')
          .eq('id', body.resumeId)
          .single()
        
        if (resumeError || !resume) {
          console.error('❌ Resume fetch error:', resumeError)
          return NextResponse.json(
            { error: 'Failed to fetch resume data' },
            { status: 500 }
          )
        }
        
        console.log('📊 Resume extracted keywords:', resume.extracted_keywords)
        
        // Use AI-extracted data for search
        if (resume.extracted_keywords) {
          const extractedData = resume.extracted_keywords
          
          // Use the AI-extracted keywords for search
          jobKeywords = extractedData.searchKeywords || []
          
          // Use the first suggested job title if no manual override
          if (!searchJobTitle && extractedData.jobTitles && extractedData.jobTitles.length > 0) {
            searchJobTitle = extractedData.currentJobTitle || extractedData.jobTitles[0]
          }
          
          // Use the preferred location from resume if no manual override
          if (!searchLocation && extractedData.preferredLocation) {
            searchLocation = extractedData.preferredLocation
          }
          
          // Add key skills to search keywords
          if (extractedData.keySkills) {
            jobKeywords = [...new Set([...jobKeywords, ...extractedData.keySkills])]
          }
          
          console.log('🎯 Using AI-extracted search params:', {
            jobKeywords: jobKeywords.slice(0, 5), // Log first 5 keywords
            searchJobTitle,
            searchLocation
          })
        }
      } else {
        // For manual search, use provided keywords or job title
        jobKeywords = searchParams.keywords || [searchParams.jobTitle]
      }
      
      // Create job search record
      const { data: jobSearch, error: searchError } = await supabaseAdmin
        .from('job_searches')
        .insert({
          user_id: userId,
          search_type: searchType,
          resume_id: body.resumeId || null,
          job_title: searchJobTitle,
          location: searchLocation,
          location_type: searchParams.locationType || 'any',
          search_keywords: jobKeywords,
          status: 'running'
        })
        .select()
        .single()

      if (searchError || !jobSearch) {
        console.error('❌ Job search creation error:', searchError)
        return NextResponse.json(
          { error: 'Failed to create job search record' },
          { status: 500 }
        )
      }

      console.log('📝 Job search record created:', jobSearch.id)

      // Search for jobs using the keywords (either manual or AI-extracted)
      const glassdoorJobs = await searchGlassdoor(jobKeywords.slice(0, 10), searchLocation)

      console.log(`🎉 Total jobs found: ${glassdoorJobs.length}`)

      // For resume searches, rank jobs based on keyword matches
      let finalJobs = glassdoorJobs
      
      if (searchType === 'resume' && jobKeywords.length > 0) {
        // Score each job based on keyword matches
        finalJobs = glassdoorJobs.map(job => {
          let score = 0
          const jobText = `${job.jobTitle} ${job.description} ${job.company}`.toLowerCase()
          
          // Count keyword matches
          jobKeywords.forEach(keyword => {
            if (jobText.includes(keyword.toLowerCase())) {
              score += 1
            }
          })
          
          return {
            ...job,
            relevanceScore: score / jobKeywords.length // Normalize score
          }
        })
        
        // Sort by relevance score
        finalJobs.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        
        console.log('🎯 Jobs sorted by resume relevance')
      }

      const uniqueJobs = detectAndMergeDuplicates(finalJobs)
      console.log(`🔍 After removing duplicates: ${uniqueJobs.length} unique jobs`)

      // Apply keyword boost scoring
      const jobsWithBoostedScores = uniqueJobs.map(job => {
        let scoreBoost = 0;
        const description = (job.description || '').toLowerCase();
        const title = (job.jobTitle || '').toLowerCase();
    
        // Check each keyword
        jobKeywords.forEach(keyword => {
          const lowerKeyword = keyword.toLowerCase();
          if (title.includes(lowerKeyword)) scoreBoost += 0.2;  // 20% boost for title match
          if (description.includes(lowerKeyword)) scoreBoost += 0.1;  // 10% boost for description match
        });
    
        // Apply boost (max relevance score is 1.0)
        const newScore = Math.min((job.relevanceScore || 0.5) + scoreBoost, 1.0);
    
        return {
          ...job,
          relevanceScore: newScore
        };
      });

      // Save jobs to database
      const jobsToSave = jobsWithBoostedScores.map(job => ({
      search_id: jobSearch.id,
      job_board: job.jobBoard,
      job_title: job.jobTitle,
      company_name: job.company,  // Changed from 'company'
      location: job.location,
      salary_range: job.salary,    // Changed from 'salary'
      job_url: job.jobUrl,
      job_description: job.description,  // Changed from 'description'
      posted_date: job.postedDate,
      relevance_score: job.relevanceScore
      }))

      console.log(`💾 Attempting to save ${jobsToSave.length} jobs to database`)

      if (jobsToSave.length > 0) {
        const { data: savedJobs, error: saveError } = await supabaseAdmin
          .from('job_search_results')
          .insert(jobsToSave)
          .select()

        if (saveError) {
          console.error('❌ Error saving jobs:', saveError)
        } else {
          console.log(`✅ Successfully saved ${savedJobs?.length || 0} jobs`)
        }
      }

      // Update job search status
      const { error: updateError } = await supabaseAdmin
        .from('job_searches')
        .update({
          status: 'completed',
          total_results: jobsWithBoostedScores.length
        })
        .eq('id', jobSearch.id)

      if (updateError) {
        console.error('❌ Error updating job search status:', updateError)
      }

      console.log('✅ Job search completed successfully')

      return NextResponse.json({
        success: true,
        searchId: jobSearch.id,
        totalJobs: jobsWithBoostedScores.length,
        jobs: jobsWithBoostedScores
      })
    }

    return NextResponse.json(
      { error: 'Invalid search type' },
      { status: 400 }
    )
   } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
