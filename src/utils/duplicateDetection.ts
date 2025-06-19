// Simple duplicate detection for job listings
export function detectAndMergeDuplicates(jobs: any[]): any[] {
  const seen = new Map();
  const results = [];

  for (const job of jobs) {
    // Handle both formats: company_name (from DB) and company (from scraper)
    const companyName = job.company_name || job.company || '';
    const jobTitle = job.job_title || job.jobTitle || '';
    
    // Create a key based on company + title (lowercase, trimmed)
    const key = `${companyName.toLowerCase().trim()}-${jobTitle.toLowerCase().trim()}`;
    
    if (!seen.has(key)) {
      seen.set(key, job);
      results.push(job);
    } else {
      // If duplicate found, keep the one with higher relevance score
      const existing = seen.get(key);
      const existingScore = existing.relevanceScore || existing.relevance_score || 0;
      const currentScore = job.relevanceScore || job.relevance_score || 0;
      
      if (currentScore > existingScore) {
        const index = results.indexOf(existing);
        results[index] = job;
        seen.set(key, job);
      }
    }
  }

  return results;
}