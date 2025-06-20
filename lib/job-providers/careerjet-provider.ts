export class CareerjetProvider extends BaseJobProvider {
  name = 'Careerjet';
  enabled = true;
  
  constructor() {
    super();
    this.apiKey = process.env.CAREERJET_API_KEY;
    this.baseUrl = 'http://public.api.careerjet.net/search';
  }
  
  async search(query: JobSearchQuery): Promise<JobSearchResult> {
    const params = new URLSearchParams({
      keywords: query.keywords,
      location: query.location || '',
      page: String(query.page || 1),
      pagesize: String(query.resultsPerPage || 20),
      affid: this.apiKey || '',
      user_ip: '1.2.3.4', // Required by API
      user_agent: 'Mozilla/5.0', // Required by API
      url: 'https://yoursite.com', // Your site URL
    });
    
    const url = `${this.baseUrl}?${params}`;
    const data = await this.fetchWithRetry(url);
    
    return {
      jobs: (data.jobs || []).map((job: any) => ({
        id: `careerjet-${job.url.split('/').pop()}`,
        title: job.title,
        company: job.company,
        location: job.locations,
        description: job.description,
        salary: job.salary ? {
          min: job.salary_min,
          max: job.salary_max,
          currency: job.salary_currency_code,
          period: job.salary_type
        } : undefined,
        url: job.url,
        source: 'Careerjet',
        postedDate: new Date(job.date),
        remote: job.title.toLowerCase().includes('remote'),
        type: 'full-time',
        tags: []
      })),
      totalResults: data.hits || 0,
      page: data.page || 1,
      totalPages: data.pages || 1,
      source: 'Careerjet'
    };
  }