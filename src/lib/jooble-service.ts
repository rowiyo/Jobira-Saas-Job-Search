export interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string;
  id: string;
}

export interface JoobleSearchParams {
  keywords: string;
  location?: string;
  radius?: string;
  salary?: string;
  page?: string;
  resultsOnPage?: string;
}

export interface JoobleResponse {
  totalCount: number;
  jobs: JoobleJob[];
}

export class JoobleService {
  private apiKey: string;
  private baseUrl: string = 'https://jooble.org/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchJobs(params: JoobleSearchParams): Promise<JoobleResponse> {
    const url = `${this.baseUrl}/${this.apiKey}`;
    
    const body = {
      keywords: params.keywords,
      location: params.location || '',
      radius: params.radius || '25',
      page: params.page || '1',
      resultsOnPage: params.resultsOnPage || '20',
      salary: params.salary || undefined,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Jooble API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Jooble search error:', error);
      throw error;
    }
  }
}