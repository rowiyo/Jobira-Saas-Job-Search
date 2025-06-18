const puppeteer = require('puppeteer');

async function simpleTest() {
  console.log('Starting simple Indeed scraper test...');
  
  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Simple search: Software Engineer in New York
    const searchUrl = 'https://indeed.com/jobs?q=software+engineer&l=New+York%2C+NY';
    console.log('Testing URL:', searchUrl);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Check if Indeed loaded
    const title = await page.title();
    console.log('Page title:', title);
    
    // Try to find job listings
    const jobCount = await page.$$eval('[data-jk]', jobs => jobs.length);
    console.log(`Found ${jobCount} job elements`);
    
    if (jobCount > 0) {
      // Extract first few jobs
      const jobs = await page.evaluate(() => {
        const jobElements = Array.from(document.querySelectorAll('[data-jk]')).slice(0, 3);
        return jobElements.map(element => {
          const titleElement = element.querySelector('h2 a span, [data-testid="job-title"] span');
          const companyElement = element.querySelector('[data-testid="company-name"]');
          
          return {
            title: titleElement?.textContent?.trim() || 'No title',
            company: companyElement?.textContent?.trim() || 'No company',
            jobKey: element.getAttribute('data-jk')
          };
        });
      });
      
      console.log('Sample jobs found:');
      jobs.forEach((job, i) => {
        console.log(`${i + 1}. ${job.title} at ${job.company} (${job.jobKey})`);
      });
    }
    
    await browser.close();
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleTest();