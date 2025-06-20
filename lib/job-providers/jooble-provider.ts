export class JoobleProvider extends BaseJobProvider {
  name = 'Jooble';
  enabled = true;
  
  constructor() {
    super();
    this.apiKey = process.env.JOOBLE_API_KEY;
    this.baseUrl = 'https://jooble.org/api';
  }
  
  async search(query: JobSearchQuery): Promise<JobSearchResult> {
    const body = {
      keywords: query.keywords,
      location: query.location || '',
      radius: '25',
      page: String(query.page || 1),
      resultsOnPage: String(query.resultsPerPage || 20),
      salary: query.salary_min ? String(query.salary_min) : undefined,
    };
    
    const url = `${this.baseUrl}/${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return {
      jobs: data.jobs.map((job: any) => ({
        id: `jooble-${job.id || Date.now()}`,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.snippet,
        salary: job.salary ? {
          min: this.parseSalary(job.salary),
          currency: 'USD',
          period: 'year'
        } : undefined,
        url: job.link,
        source: 'Jooble',
        postedDate: new Date(job.updated),
        remote: job.title.toLowerCase().includes('remote'),
        type: job.type || 'full-time',
        tags: []
      })),
      totalResults: data.totalCount || data.jobs.length,
      page: query.page || 1,
      totalPages: Math.ceil((data.totalCount || data.jobs.length) / (query.resultsPerPage || 20)),
      source: 'Jooble'
    };
  }
  
  private parseSalary(salaryStr: string): number {
    const numbers = salaryStr.replace(/[^0-9]/g, '');
    return parseInt(numbers) || 0;
  }
}