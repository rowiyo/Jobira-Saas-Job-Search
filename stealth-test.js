// linkedin-test.js - Test LinkedIn Jobs scraping
const puppeteer = require('puppeteer');

async function testLinkedIn() {
  console.log('Testing LinkedIn Jobs scraping...');
  
  try {
    const browser = await puppeteer.launch({ 
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.setViewport({ width: 1366, height: 768 });
    
    // Remove automation indicators
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    
    // LinkedIn Jobs search URL (no login required for public jobs)
    const searchUrl = 'https://www.linkedin.com/jobs/search/?keywords=software%20engineer&location=New%20York%2C%20NY';
    
    console.log('Going to LinkedIn Jobs:', searchUrl);
    
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const title = await page.title();
    console.log('Page title:', title);
    
    // Wait for jobs to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try multiple selectors for LinkedIn job cards
    const selectors = [
      '.job-search-card',
      '.jobs-search__results-list li',
      '[data-entity-urn*="job"]',
      '.job-result-card'
    ];
    
    let jobCount = 0;
    let workingSelector = '';
    
    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          jobCount = elements.length;
          workingSelector = selector;
          console.log(`Found ${jobCount} jobs using selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (jobCount > 0) {
      // Extract job data
      const jobs = await page.evaluate((selector) => {
        const jobCards = Array.from(document.querySelectorAll(selector)).slice(0, 5);
        
        return jobCards.map((card, index) => {
          // Job title selectors
          const titleSelectors = [
            '.base-search-card__title',
            '.job-search-card__title',
            'h3 a',
            'h4 a'
          ];
          
          let title = 'No title';
          for (const sel of titleSelectors) {
            const titleEl = card.querySelector(sel);
            if (titleEl && titleEl.textContent.trim()) {
              title = titleEl.textContent.trim();
              break;
            }
          }
          
          // Company selectors
          const companySelectors = [
            '.base-search-card__subtitle',
            '.job-search-card__subtitle',
            '.job-result-card__subtitle',
            'h4'
          ];
          
          let company = 'No company';
          for (const sel of companySelectors) {
            const companyEl = card.querySelector(sel);
            if (companyEl && companyEl.textContent.trim()) {
              company = companyEl.textContent.trim();
              break;
            }
          }
          
          // Location selectors
          const locationSelectors = [
            '.job-search-card__location',
            '.job-result-card__location',
            '.base-search-card__metadata'
          ];
          
          let location = 'No location';
          for (const sel of locationSelectors) {
            const locationEl = card.querySelector(sel);
            if (locationEl && locationEl.textContent.trim()) {
              location = locationEl.textContent.trim();
              break;
            }
          }
          
          // Job URL
          const linkEl = card.querySelector('a[href*="/jobs/view/"]');
          const jobUrl = linkEl ? linkEl.href : null;
          
          return {
            index: index + 1,
            title,
            company,
            location,
            jobUrl,
            jobBoard: 'LinkedIn'
          };
        });
      }, workingSelector);
      
      console.log('\n📋 LinkedIn Jobs Found:');
      console.log('='.repeat(50));
      jobs.forEach(job => {
        console.log(`${job.index}. ${job.title}`);
        console.log(`   Company: ${job.company}`);
        console.log(`   Location: ${job.location}`);
        console.log(`   URL: ${job.jobUrl ? job.jobUrl.substring(0, 60) + '...' : 'N/A'}`);
        console.log('');
      });
      
      console.log('✅ LinkedIn scraping successful!');
      
    } else {
      console.log('❌ No jobs found on LinkedIn');
      
      // Debug info
      const content = await page.content();
      console.log('Page content length:', content.length);
      console.log('Current URL:', page.url());
      
      // Check if we're being redirected or blocked
      if (title.toLowerCase().includes('sign in') || title.toLowerCase().includes('login')) {
        console.log('💡 LinkedIn is asking for login - this is normal for some searches');
      }
    }
    
    console.log('\nBrowser staying open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ LinkedIn test failed:', error.message);
  }
}

testLinkedIn();