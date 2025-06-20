export class TheirStackProvider extends BaseJobProvider {
  name = 'TheirStack';
  enabled = true;
  
  constructor() {
    super();
    this.apiKey = process.env.THEIRSTACK_API_KEY;
    this.baseUrl = 'https://api.theirstack.com/v1/jobs/search';
  }
  
  async search(query: JobSearchQuery): Promise<JobSearchResult> {
    const body = {
      keyword: query.keywords,
      location: query.location,
      page: query.page || 1,
      limit: query.resultsPerPage || 20,
      remote: query.remote || false,
      min_salary: query.salary_min,
      job_type: query.job_type,
    };
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return {
      jobs: (data.data || []).map((job: any) => ({
        id: `theirstack-${job.id}`,
        title: job.title,
        company: job.company_name,
        location: job.location || 'Not specified',
        description: job.description,
        salary: job.salary_min || job.salary_max ? {
          min: job.salary_min,
          max: job.salary_max,
          currency: job.salary_currency || 'USD',
          period: 'year'
        } : undefined,
        url: job.url,
        source: job.source || 'TheirStack',
        postedDate: new Date(job.posted_date || job.created_at),
        remote: job.is_remote || false,
        type: job.employment_type || 'full-time',
        category: job.category,
        tags: job.skills || []
      })),
      totalResults: data.total || data.count || 0,
      page: query.page || 1,
      totalPages: data.total_pages || Math.ceil((data.total || 0) / (query.resultsPerPage || 20)),
      source: 'TheirStack'
    };
  }
}
