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
      
      const { data: jobSearch, error: searchError } = await supabaseAdmin
        .from('job_searches')
        .insert({
          user_id: userId,
          search_type: searchType,
          resume_id: body.resumeId || null,
          job_title: searchParams.jobTitle,
          location: searchParams.location,
          location_type: searchParams.locationType || 'any',
          search_keywords: searchParams.keywords || [],
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

      const jobKeywords = searchParams.keywords || [searchParams.jobTitle]
      const glassdoorJobs = await searchGlassdoor(jobKeywords, searchParams.location)

      console.log(`🎉 Total jobs found: ${glassdoorJobs.length}`)

      const uniqueJobs = detectAndMergeDuplicates(glassdoorJobs)
      console.log(`🔍 After removing duplicates: ${uniqueJobs.length} unique jobs`)

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

console.log(`🎯 Applied keyword relevance boosts`);

      if (jobsWithBoostedScores.length > 0) {
      const jobRecords = jobsWithBoostedScores.map(job => ({
        search_id: jobSearch.id,
        job_board: job.jobBoard,
        job_title: job.jobTitle,
        company_name: job.company,
        location: job.location,
        job_url: job.jobUrl,
        job_description: job.description,
        salary_range: job.salary,
        posted_date: new Date().toISOString().split('T')[0],
        relevance_score: job.relevanceScore
        }))

        const { error: insertError } = await supabaseAdmin
          .from('job_search_results')
          .insert(jobRecords)

        if (insertError) {
          console.error('❌ Error saving job results:', insertError)
        } else {
          console.log('💾 Job results saved to database')
        }
      }

      await supabaseAdmin
        .from('job_searches')
        .update({
          status: 'completed',
          total_results: uniqueJobs.length
      })
        .eq('id', jobSearch.id)

      console.log('✅ Job search completed successfully!')

      return NextResponse.json({
        success: true,
        searchId: jobSearch.id,
        totalJobs: glassdoorJobs.length,
        jobs: glassdoorJobs
      })
    }

    return NextResponse.json({ error: 'Invalid search type' }, { status: 400 })

  } catch (error: any) {
    console.error('💥 Job search API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}