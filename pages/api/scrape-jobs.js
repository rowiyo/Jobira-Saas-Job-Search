// pages/api/scrape-jobs.js - Production Indeed Scraper
const puppeteer = require('puppeteer');
const { createServerSupabaseClient } = require('@supabase/auth-helpers-nextjs');

class IndeedScraper {
  constructor() {
    this.baseUrl = 'https://indeed.com/jobs';
    this.userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
  }

  buildSearchUrl(searchParams) {
    const { jobTitle, location, locationType, salaryMin, keywords } = searchParams;
    
    // Build search query
    let query = jobTitle;
    if (keywords && keywords.length > 0) {
      query += ` ${keywords.slice(0, 3).join(' ')}`; // Limit keywords to avoid overly complex queries
    }
    
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('l', location);
    
    // Add remote filter if specified
    if (locationType === 'remote') {
      params.set('remotejob', '1');
    }
    
    // Add salary filter if specified
    if (salaryMin) {
      params.set('salary', `$${salaryMin}+`);
    }
    
    // Sort by date (newest first) and limit results
    params.set('sort', 'date');
    params.set('limit', '50'); // Indeed's max without login
    
    return `${this.baseUrl}?${params.toString()}`;
  }

  async scrapeJobs(searchParams, maxResults = 25) {
    let browser;
    
    try {
      // Launch browser with stealth settings
      browser = await puppeteer.launch({
        headless: true, // Set to false for debugging
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      const page = await browser.newPage();
      
      // Set random user agent
      const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      await page.setUserAgent(userAgent);
      
      // Set realistic viewport
      await page.setViewport({ width: 1366, height: 768 });
      
      // Remove automation indicators
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        delete navigator.__proto__.webdriver;
        
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });

      // Set realistic headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });

      // Block images and CSS for faster loading
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.resourceType() === 'stylesheet' || req.resourceType() === 'image') {
          req.abort();
        } else {
          req.continue();
        }
      });

      console.log('🔍 Starting Indeed job search...');
      
      // Step 1: Visit Indeed homepage first to establish session
      await page.goto('https://indeed.com', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait to appear more human
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Step 2: Navigate to search results
      const searchUrl = this.buildSearchUrl(searchParams);
      console.log('🔗 Search URL:', searchUrl);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      const pageTitle = await page.title();
      console.log('📄 Page title:', pageTitle);
      
      // Check if we're blocked or need verification
      if (pageTitle.toLowerCase().includes('blocked') || 
          pageTitle.toLowerCase().includes('just a moment') ||
          pageTitle.toLowerCase().includes('verify')) {
        throw new Error('Indeed is blocking our requests. Try again later or use a different approach.');
      }

      // Wait for job listings to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Extract job data
      const jobs = await page.evaluate(() => {
        // Look for job elements with multiple selectors
        const selectors = [
          '[data-jk]',
          '.jobsearch-SerpJobCard',
          '.job_seen_beacon'
        ];
        
        let jobElements = [];
        for (const selector of selectors) {
          jobElements = document.querySelectorAll(selector);
          if (jobElements.length > 0) break;
        }
        
        if (jobElements.length === 0) {
          console.log('No job elements found');
          return [];
        }
        
        console.log(`Found ${jobElements.length} job elements`);
        
        const extractedJobs = [];
        
        Array.from(jobElements).forEach((element, index) => {
          try {
            // Extract job key
            const jobKey = element.getAttribute('data-jk') || `indeed-${index}`;
            
            // Extract job title with multiple selectors
            const titleSelectors = [
              'h2 a span[title]',
              '[data-testid="job-title"] span',
              'h2 a',
              '.jobTitle a',
              '.jobTitle span'
            ];
            
            let jobTitle = '';
            for (const selector of titleSelectors) {
              const titleEl = element.querySelector(selector);
              if (titleEl && titleEl.textContent.trim()) {
                jobTitle = titleEl.textContent.trim();
                break;
              }
            }
            
            // Extract company name
            const companySelectors = [
              '[data-testid="company-name"]',
              '.companyName',
              'span.companyName a',
              'span.companyName'
            ];
            
            let companyName = '';
            for (const selector of companySelectors) {
              const companyEl = element.querySelector(selector);
              if (companyEl && companyEl.textContent.trim()) {
                companyName = companyEl.textContent.trim();
                break;
              }
            }
            
            // Extract location
            const locationSelectors = [
              '[data-testid="job-location"]',
              '.companyLocation',
              '.locationsContainer'
            ];
            
            let location = '';
            for (const selector of locationSelectors) {
              const locationEl = element.querySelector(selector);
              if (locationEl && locationEl.textContent.trim()) {
                location = locationEl.textContent.trim();
                break;
              }
            }
            
            // Extract job description/snippet
            const descriptionSelectors = [
              '[data-testid="job-snippet"]',
              '.summary',
              '.job-snippet'
            ];
            
            let jobDescription = '';
            for (const selector of descriptionSelectors) {
              const descEl = element.querySelector(selector);
              if (descEl && descEl.textContent.trim()) {
                jobDescription = descEl.textContent.trim();
                break;
              }
            }
            
            // Extract salary if available
            const salarySelectors = [
              '.salary-snippet',
              '.estimated-salary',
              '[data-testid="job-salary"]'
            ];
            
            let salaryRange = null;
            for (const selector of salarySelectors) {
              const salaryEl = element.querySelector(selector);
              if (salaryEl && salaryEl.textContent.trim()) {
                salaryRange = salaryEl.textContent.trim();
                break;
              }
            }
            
            // Extract posting date
            const dateSelectors = [
              '.date',
              '[data-testid="myJobsStateDate"]',
              '.dateContainer'
            ];
            
            let postedDate = null;
            for (const selector of dateSelectors) {
              const dateEl = element.querySelector(selector);
              if (dateEl && dateEl.textContent.trim()) {
                postedDate = dateEl.textContent.trim();
                break;
              }
            }
            
            // Build job URL
            const linkEl = element.querySelector('h2 a, [data-testid="job-title"] a');
            let jobUrl = null;
            if (linkEl && linkEl.href) {
              jobUrl = linkEl.href.startsWith('http') ? linkEl.href : `https://indeed.com${linkEl.href}`;
            }
            
            // Only add jobs with essential data
            if (jobTitle && companyName && jobKey) {
              extractedJobs.push({
                jobKey,
                jobTitle: jobTitle.substring(0, 300), // Limit length
                companyName: companyName.substring(0, 200),
                location: location.substring(0, 200),
                jobDescription: jobDescription.substring(0, 1000), // Limit description length
                salaryRange,
                postedDate,
                jobUrl,
                jobBoard: 'Indeed'
              });
            }
          } catch (error) {
            console.error('Error extracting job:', error);
          }
        });

        console.log(`Successfully extracted ${extractedJobs.length} jobs`);
        return extractedJobs;
      });

      console.log(`✅ Scraped ${jobs.length} jobs from Indeed`);
      return jobs.slice(0, maxResults);

    } catch (error) {
      console.error('❌ Indeed scraping error:', error);
      throw new Error(`Failed to scrape Indeed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // Calculate relevance score based on search criteria
  calculateRelevanceScore(job, searchParams) {
    let score = 0.5; // Base score
    
    const { jobTitle, keywords } = searchParams;
    const jobTitleLower = job.jobTitle.toLowerCase();
    const descriptionLower = job.jobDescription.toLowerCase();
    const searchTitleLower = jobTitle.toLowerCase();
    
    // Title match bonus (30% weight)
    if (jobTitleLower.includes(searchTitleLower)) {
      score += 0.3;
    }
    
    // Keywords match bonus (20% weight)
    if (keywords && keywords.length > 0) {
      const keywordMatches = keywords.filter(keyword => 
        jobTitleLower.includes(keyword.toLowerCase()) || 
        descriptionLower.includes(keyword.toLowerCase())
      );
      score += (keywordMatches.length / keywords.length) * 0.2;
    }
    
    // Salary information bonus (10% weight)
    if (job.salaryRange) {
      score += 0.1;
    }
    
    // Recent posting bonus (10% weight)
    if (job.postedDate && (
      job.postedDate.includes('today') || 
      job.postedDate.includes('1 day') ||
      job.postedDate.includes('Just posted')
    )) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }
}

// Main API handler for Next.js
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });
  const { searchId, searchParams } = req.body;

  if (!searchId || !searchParams) {
    return res.status(400).json({ message: 'Missing searchId or searchParams' });
  }

  try {
    console.log('🚀 Starting job scraping for search:', searchId);
    
    // Update search status to 'in_progress'
    await supabase
      .from('job_searches')
      .update({ status: 'in_progress' })
      .eq('id', searchId);

    // Initialize scraper and scrape jobs
    const scraper = new IndeedScraper();
    const scrapedJobs = await scraper.scrapeJobs(searchParams, 25);
    
    if (scrapedJobs.length === 0) {
      await supabase
        .from('job_searches')
        .update({ 
          status: 'completed',
          total_results: 0 
        })
        .eq('id', searchId);
      
      return res.status(200).json({ 
        message: 'No jobs found',
        searchId,
        totalResults: 0 
      });
    }

    // Process jobs and calculate relevance scores
    const jobResults = scrapedJobs.map(job => ({
      search_id: searchId,
      job_board: 'Indeed',
      job_title: job.jobTitle,
      company_name: job.companyName,
      location: job.location,
      job_url: job.jobUrl,
      job_description: job.jobDescription,
      salary_range: job.salaryRange,
      posted_date: new Date().toISOString().split('T')[0], // Today's date as fallback
      relevance_score: scraper.calculateRelevanceScore(job, searchParams)
    }));

    // Save results to database
    const { error: insertError } = await supabase
      .from('job_search_results')
      .insert(jobResults);

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw insertError;
    }

    // Update search with completion status
    await supabase
      .from('job_searches')
      .update({ 
        status: 'completed',
        total_results: scrapedJobs.length 
      })
      .eq('id', searchId);

    console.log('✅ Job scraping completed successfully');

    res.status(200).json({
      message: 'Jobs scraped successfully',
      searchId,
      totalResults: scrapedJobs.length,
      jobBoard: 'Indeed'
    });

  } catch (error) {
    console.error('❌ Scraping API error:', error);
    
    // Update search status to 'failed'
    await supabase
      .from('job_searches')
      .update({ status: 'failed' })
      .eq('id', searchId);

    res.status(500).json({ 
      message: 'Failed to scrape jobs',
      error: error.message 
    });
  }
};

// Export scraper class for testing
module.exports.IndeedScraper = IndeedScraper;