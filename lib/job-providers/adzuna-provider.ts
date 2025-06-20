export class AdzunaProvider extends BaseJobProvider {
  name = 'Adzuna';
  enabled = true;
  
  constructor() {
    super();
    this.apiKey = process.env.ADZUNA_API_KEY;
    this.baseUrl = 'https://api.adzuna.com/v1/api/jobs';
  }
  
  async search(query: JobSearchQuery): Promise<JobSearchResult> {
    const appId = process.env.ADZUNA_APP_ID;
    const country = query.location?.toLowerCase().includes('uk') ? 'gb' : 'us';
    
    const params = new URLSearchParams({
      app_id: appId || '',
      app_key: this.apiKey || '',
      results_per_page: String(query.resultsPerPage || 20),
      page: String(query.page || 1),
      what: query.keywords,
      where: query.location || '',
      sort_by: 'date',
      full_time: query.job_type === 'full-time' ? '1' : '0',
    });
    
    if (query.salary_min) {
      params.append('salary_min', String(query.salary_min));
    }
    
    const url = `${this.baseUrl}/${country}/search/1?${params}`;
    const data = await this.fetchWithRetry(url);
    
    return {
      jobs: data.results.map((job: any) => ({
        id: `adzuna-${job.id}`,
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        description: job.description,
        salary: job.salary_min || job.salary_max ? {
          min: job.salary_min,
          max: job.salary_max,
          currency: job.salary_currency || 'USD',
          period: 'year'
        } : undefined,
        url: job.redirect_url,
        source: 'Adzuna',
        postedDate: new Date(job.created),
        remote: job.title.toLowerCase().includes('remote') || 
                job.description.toLowerCase().includes('remote'),
        type: job.contract_type || 'full-time',
        category: job.category?.label,
        tags: job.category?.tag ? [job.category.tag] : []
      })),
      totalResults: data.count,
      page: query.page || 1,
      totalPages: Math.ceil(data.count / (query.resultsPerPage || 20)),
      source: 'Adzuna'
    };
  }