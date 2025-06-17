import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Job search interface
interface JobResult {
  jobBoard: string
  jobTitle: string
  company: string
  location: string
  salary?: string
  jobUrl: string
  description: string
  postedDate?: string
  relevanceScore?: number
}

// Mock job scraper for Indeed
async function searchIndeed(keywords: string[], location: string): Promise<JobResult[]> {
  console.log('🔍 Searching Indeed for:', { keywords: keywords.slice(0, 3), location })
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const mockJobs: JobResult[] = [
    {
      jobBoard: 'Indeed',
      jobTitle: 'Principal Quality Assurance Engineer',
      company: 'TechCorp Solutions',
      location: 'Boston, MA',
      salary: '$120,000 - $150,000',
      jobUrl: 'https://indeed.com/job/12345',
      description: 'Lead QA engineering team, develop test automation frameworks using Selenium and Cypress. Experience with CI/CD pipelines and Agile methodologies required.',
      postedDate: '2 days ago',
      relevanceScore: 0.95
    },
    {
      jobBoard: 'Indeed',
      jobTitle: 'Senior Software Test Engineer',
      company: 'Innovation Labs Inc',
      location: 'Cambridge, MA',
      salary: '$110,000 - $140,000',
      jobUrl: 'https://indeed.com/job/67890',
      description: 'Design and execute comprehensive test plans for web applications. Proficiency in JavaScript, Python, and automated testing tools required.',
      postedDate: '1 week ago',
      relevanceScore: 0.88
    },
    {
      jobBoard: 'Indeed',
      jobTitle: 'QA Manager',
      company: 'StartupHub',
      location: 'Remote',
      salary: '$130,000 - $160,000',
      jobUrl: 'https://indeed.com/job/54321',
      description: 'Manage QA team of 8+ engineers, establish testing best practices, mentor junior staff. Experience with test management tools and Agile processes.',
      postedDate: '3 days ago',
      relevanceScore: 0.92
    }
  ]
  
  console.log(`✅ Indeed found ${mockJobs.length} jobs`)
  return mockJobs
}

// Mock job scraper for LinkedIn
async function searchLinkedIn(keywords: string[], location: string): Promise<JobResult[]> {
  console.log('🔍 Searching LinkedIn for:', { keywords: keywords.slice(0, 3), location })
  
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const mockJobs: JobResult[] = [
    {
      jobBoard: 'LinkedIn',
      jobTitle: 'Lead Quality Engineer',
      company: 'Enterprise Software Co',
      location: 'Worcester, MA',
      salary: '$125,000 - $155,000',
      jobUrl: 'https://linkedin.com/jobs/12345',
      description: 'Lead quality engineering initiatives, implement test automation strategies, collaborate with development teams in Agile environment.',
      postedDate: '4 days ago',
      relevanceScore: 0.90
    },
    {
      jobBoard: 'LinkedIn',
      jobTitle: 'Senior QA Automation Engineer',
      company: 'FinTech Solutions',
      location: 'Springfield, MA',
      salary: '$115,000 - $145,000',
      jobUrl: 'https://linkedin.com/jobs/67890',
      description: 'Develop automated test suites using Selenium, Cypress, and Jest. Experience with API testing and performance testing tools preferred.',
      postedDate: '1 week ago',
      relevanceScore: 0.85
    }
  ]
  
  console.log(`✅ LinkedIn found ${mockJobs.length} jobs`)
  return mockJobs
}

// Mock job scraper for Glassdoor
async function searchGlassdoor(keywords: string[], location: string): Promise<JobResult[]> {
  console.log('🔍 Searching Glassdoor for:', { keywords: keywords.slice(0, 3), location })
  
  await new Promise(resolve => setTimeout(resolve, 600))
  
  const mockJobs: JobResult[] = [
    {
      jobBoard: 'Glassdoor',
      jobTitle: 'Principal Test Engineer',
      company: 'Cloud Services Inc',
      location: 'Remote (MA)',
      salary: '$140,000 - $170,000',
      jobUrl: 'https://glassdoor.com/job/12345',
      description: 'Senior technical role leading test engineering efforts for cloud-based applications. Strong background in test automation and team leadership required.',
      postedDate: '5 days ago',
      relevanceScore: 0.93
    }
  ]
  
  console.log(`✅ Glassdoor found ${mockJobs.length} jobs`)
  return mockJobs
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting job search...')
    
    const body = await request.json()
    const { resumeId, userId, searchLocation } = body

    if (!resumeId || !userId) {
      return NextResponse.json(
        { error: 'Missing resumeId or userId' },
        { status: 400 }
      )
    }

    console.log('📋 Job search params:', { resumeId, userId, searchLocation })

    // Get resume data with parsed keywords
    const { data: resume, error: resumeError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single()

    if (resumeError || !resume) {
      console.error('❌ Resume fetch error:', resumeError)
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    console.log('🔍 Raw resume data:', resume.extracted_keywords)

    const extractedData = resume.extracted_keywords
    if (!extractedData) {
      return NextResponse.json(
        { error: 'No extracted data found in resume' },
        { status: 400 }
      )
    }

    // Try different possible keyword locations
    let resumeKeywords = extractedData.searchKeywords || 
                        extractedData.searchOptimization?.searchKeywords ||
                        extractedData.keySkills ||
                        extractedData.experience?.keySkills ||
                        []

    console.log('🎯 Found resume keywords:', resumeKeywords)

    if (!resumeKeywords || resumeKeywords.length === 0) {
      console.log('❌ Available data keys:', Object.keys(extractedData))
      return NextResponse.json(
        { error: `No search keywords found. Available keys: ${Object.keys(extractedData).join(', ')}` },
        { status: 400 }
      )
    }

    // Update the extractedData to use the found keywords
    extractedData.searchKeywords = resumeKeywords

    console.log('📄 Resume data found:', {
      jobTitle: extractedData.currentJobTitle,
      keywords: extractedData.searchKeywords?.slice(0, 5),
      experienceLevel: extractedData.experienceLevel
    })

    // Create job search record
    const { data: jobSearch, error: searchError } = await supabaseAdmin
      .from('job_searches')
      .insert({
        user_id: userId,
        resume_id: resumeId,
        search_type: 'resume_based',
        job_title: extractedData.currentJobTitle,
        location: searchLocation || extractedData.preferredLocation || 'Remote',
        location_type: 'any',
        search_keywords: extractedData.searchKeywords,
        experience_level: extractedData.experienceLevel,
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

    // Search across multiple job boards in parallel
    const jobLocation = jobSearch.location
    const jobKeywords = extractedData.searchKeywords.slice(0, 8) // Use top keywords

    console.log('🎯 Searching job boards with:', { jobKeywords, jobLocation })

    const searchPromises = [
      searchIndeed(jobKeywords, jobLocation),
      searchLinkedIn(jobKeywords, jobLocation),
      searchGlassdoor(jobKeywords, jobLocation)
    ]

    const searchResults = await Promise.allSettled(searchPromises)
    
    // Combine all successful results
    let allJobs: JobResult[] = []
    let successfulBoards = 0
    let failedBoards = 0

    searchResults.forEach((result, index) => {
      const boardNames = ['Indeed', 'LinkedIn', 'Glassdoor']
      if (result.status === 'fulfilled') {
        allJobs = allJobs.concat(result.value)
        successfulBoards++
        console.log(`✅ ${boardNames[index]} search completed: ${result.value.length} jobs`)
      } else {
        failedBoards++
        console.error(`❌ ${boardNames[index]} search failed:`, result.reason)
      }
    })

    // Sort by relevance score
    allJobs.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))

    console.log(`🎉 Total jobs found: ${allJobs.length} from ${successfulBoards} boards`)

    // Save job results to database
    if (allJobs.length > 0) {
      const jobRecords = allJobs.map(job => ({
        search_id: jobSearch.id,
        job_board: job.jobBoard,
        job_title: job.jobTitle,
        company_name: job.company,
        location: job.location,
        job_url: job.jobUrl,
        job_description: job.description,
        salary_range: job.salary,
        posted_date: job.postedDate ? new Date().toISOString().split('T')[0] : null,
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

    // Update search status and total results
    await supabaseAdmin
      .from('job_searches')
      .update({
        status: 'completed',
        total_results: allJobs.length
      })
      .eq('id', jobSearch.id)

    console.log('✅ Job search completed successfully!')

    return NextResponse.json({
      success: true,
      searchId: jobSearch.id,
      totalJobs: allJobs.length,
      jobBoardsSearched: successfulBoards,
      failedBoards: failedBoards,
      jobs: allJobs.slice(0, 20), // Return first 20 jobs
      searchSummary: {
        keywords: jobKeywords,
        location: jobLocation,
        experienceLevel: extractedData.experienceLevel,
        jobTitle: extractedData.currentJobTitle
      }
    })

  } catch (error: any) {
    console.error('💥 Job search API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}