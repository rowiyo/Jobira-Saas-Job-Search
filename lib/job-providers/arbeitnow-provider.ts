export class ArbeitnowProvider extends BaseJobProvider {
  name = 'Arbeitnow';
  enabled = true;
  
  constructor() {
    super();
    // No API key required!
    this.baseUrl = 'https://www.arbeitnow.com/api/job-board-api';
  }
  
  async search(query: JobSearchQuery): Promise<JobSearchResult> {
    // Arbeitnow returns all jobs, we'll filter client-side
    const data = await this.fetchWithRetry(this.baseUrl);
    
    let jobs = data.data || [];
    
    // Filter by keywords
    if (query.keywords) {
      const keywords = query.keywords.toLowerCase().split(' ');
      jobs = jobs.filter((job: any) => {
        const searchText = `${job.title} ${job.company_name} ${job.description}`.toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword));
      });
    }
    
    // Filter by location
    if (query.location) {
      jobs = jobs.filter((job: any) => 
        job.location?.toLowerCase().includes(query.location!.toLowerCase())
      );
    }
    
    // Filter by remote
    if (query.remote) {
      jobs = jobs.filter((job: any) => job.remote === true);
    }
    
    // Pagination
    const page = query.page || 1;
    const perPage = query.resultsPerPage || 20;
    const start = (page - 1) * perPage;
    const paginatedJobs = jobs.slice(start, start + perPage);
    
    return {
      jobs: paginatedJobs.map((job: any) => ({
        id: `arbeitnow-${job.slug}`,
        title: job.title,
        company: job.company_name,
        location: job.location || 'Remote',
        description: job.description,
        url: job.url,
        source: 'Arbeitnow',
        postedDate: new Date(job.created_at),
        remote: job.remote,
        type: job.job_types?.[0] || 'full-time',
        tags: job.tags || []
      })),
      totalResults: jobs.length,
      page,
      totalPages: Math.ceil(jobs.length / perPage),
      source: 'Arbeitnow'
    };
  }
}
