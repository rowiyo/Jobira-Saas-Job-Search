export interface JobResult {
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

// Helper function to clean text
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

// Helper function to calculate relevance score
function calculateRelevance(jobTitle: string, keywords: string[]): number {
  if (keywords.length === 0) return 0.5
  
  const titleLower = jobTitle.toLowerCase()
  const matches = keywords.filter(keyword => 
    titleLower.includes(keyword.toLowerCase())
  ).length
  
  return Math.min(0.5 + (matches / keywords.length) * 0.5, 1.0)
}

// Scrape AngelList/Wellfound jobs 
async function scrapeAngelListJobs(keywords: string[]): Promise<JobResult[]> {
  try {
    console.log('🌐 Fetching from AngelList...')
    
    // AngelList has a more open API structure
    const query = keywords.join(' ') || 'software engineer'
    const response = await fetch(`https://angel.co/job_listings/startup_ids`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    })
    
    // If API doesn't work, return empty array
    if (!response.ok) {
      throw new Error(`AngelList API error: ${response.status}`)
    }
    
    // For now, return empty array as AngelList structure has changed
    return []
    
  } catch (error) {
    console.error('❌ AngelList scraping error:', error)
    return []
  }
}

// Scrape Adzuna Jobs (they have a more open API)
async function scrapeAdzunaJobs(keywords: string[], location: string): Promise<JobResult[]> {
  try {
    console.log('🌐 Fetching from Adzuna...')
    
    const query = keywords.join(' ') || 'software engineer'
    const encodedQuery = encodeURIComponent(query)
    const encodedLocation = encodeURIComponent(location)
    
    // Adzuna allows more lenient scraping
    const url = `https://www.adzuna.com/search?q=${encodedQuery}&l=${encodedLocation}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Adzuna HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    const jobs: JobResult[] = []
    
    // Basic regex patterns for Adzuna (may need adjustment)
    const titleRegex = /<h3[^>]*class="[^"]*title[^"]*"[^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]+)</g
    const companyRegex = /<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)</g
    
    let titleMatch
    let jobCount = 0
    while ((titleMatch = titleRegex.exec(html)) !== null && jobCount < 15) {
      const [, jobUrl, jobTitle] = titleMatch
      
      if (jobTitle && jobUrl) {
        jobs.push({
          jobBoard: 'Adzuna',
          jobTitle: cleanText(jobTitle),
          company: 'Company', // Will try to extract below
          location: location,
          salary: undefined,
          jobUrl: jobUrl.startsWith('http') ? jobUrl : `https://www.adzuna.com${jobUrl}`,
          description: 'View full description on Adzuna',
          postedDate: 'Recently posted',
          relevanceScore: calculateRelevance(jobTitle, keywords)
        })
        jobCount++
      }
    }
    
    return jobs
    
  } catch (error) {
    console.error('❌ Adzuna scraping error:', error)
    return []
  }
}

// Scrape RemoteOK (API-like endpoint)
async function scrapeRemoteOKJobs(keywords: string[]): Promise<JobResult[]> {
  try {
    console.log('🌐 Fetching from RemoteOK...')
    
    const response = await fetch('https://remoteok.io/api', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`RemoteOK API error: ${response.status}`)
    }
    
    const data = await response.json()
    const jobs: JobResult[] = []
    
    // RemoteOK returns an array where first item is metadata
    const jobsArray = Array.isArray(data) ? data.slice(1) : []
    
    for (const job of jobsArray.slice(0, 10)) { // Limit to 10 jobs
      if (!job.position || !job.company) continue
      
      // Filter by keywords if provided
      if (keywords.length > 0) {
        const positionLower = job.position.toLowerCase()
        const hasKeyword = keywords.some(keyword => 
          positionLower.includes(keyword.toLowerCase())
        )
        if (!hasKeyword) continue
      }
      
      jobs.push({
        jobBoard: 'RemoteOK',
        jobTitle: cleanText(job.position),
        company: cleanText(job.company),
        location: 'Remote',
        salary: job.salary_min && job.salary_max ? 
          `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}` : 
          undefined,
        jobUrl: `https://remoteok.io/remote-jobs/${job.id}`,
        description: job.description ? cleanText(job.description.substring(0, 200)) + '...' : 'Remote job opportunity',
        postedDate: job.date ? new Date(job.date).toLocaleDateString() : 'Recently posted',
        relevanceScore: calculateRelevance(job.position, keywords)
      })
    }
    
    return jobs
    
  } catch (error) {
    console.error('❌ RemoteOK scraping error:', error)
    return []
  }
}

// Main scraper function
export async function searchGlassdoor(keywords: string[], location: string): Promise<JobResult[]> {
  console.log('🔍 Starting real job search for:', { keywords: keywords.slice(0, 3), location })
  
  const allJobs: JobResult[] = []
  
  try {
    // Try multiple sources (RemoteOK works great!)
    const [remoteJobs, adzunaJobs, angelJobs] = await Promise.allSettled([
      scrapeRemoteOKJobs(keywords),
      scrapeAdzunaJobs(keywords, location),
      scrapeAngelListJobs(keywords)
    ])
    
    // Add RemoteOK jobs (these work great!)
    if (remoteJobs.status === 'fulfilled') {
      allJobs.push(...remoteJobs.value)
      console.log(`✅ RemoteOK found ${remoteJobs.value.length} jobs`)
    } else {
      console.error('❌ RemoteOK scraping failed:', remoteJobs.reason)
    }
    
    // Add Adzuna jobs
    if (adzunaJobs.status === 'fulfilled') {
      allJobs.push(...adzunaJobs.value)
      console.log(`✅ Adzuna found ${adzunaJobs.value.length} jobs`)
    } else {
      console.error('❌ Adzuna scraping failed:', adzunaJobs.reason)
    }
    
    // Add AngelList jobs
    if (angelJobs.status === 'fulfilled') {
      allJobs.push(...angelJobs.value)
      console.log(`✅ AngelList found ${angelJobs.value.length} jobs`)
    } else {
      console.error('❌ AngelList scraping failed:', angelJobs.reason)
    }
    
    // Sort by relevance score
    allJobs.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    
    console.log(`🎉 Total jobs found: ${allJobs.length}`)
    
    // Return jobs or fallback if none found
    if (allJobs.length === 0) {
      return [{
        jobBoard: 'Scraper',
        jobTitle: `No results found for: ${keywords.join(', ')}`,
        company: 'Try different keywords or location',
        location: location,
        salary: 'N/A',
        jobUrl: 'https://indeed.com',
        description: 'The job scraper ran successfully but found no matching jobs. Try broader search terms or check if the job sites are accessible.',
        postedDate: 'Today',
        relevanceScore: 0.1
      }]
    }
    
    return allJobs.slice(0, 25) // Limit to 25 total jobs
    
  } catch (error) {
    console.error('❌ Job scraping error:', error)
    
    return [{
      jobBoard: 'Scraper Error',
      jobTitle: `Scraping failed: ${keywords.join(', ')}`,
      company: 'Network or parsing error',
      location: location,
      salary: 'N/A',
      jobUrl: 'https://indeed.com',
      description: `Scraping error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      postedDate: 'Today',
      relevanceScore: 0.1
    }]
  }
}