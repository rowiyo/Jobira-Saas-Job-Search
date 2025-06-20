export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  url: string;
  source: string;
  postedDate: Date;
  remote: boolean;
  type?: string; // full-time, part-time, contract, etc.
  category?: string;
  tags?: string[];
}

export interface JobSearchQuery {
  keywords: string;
  location?: string;
  remote?: boolean;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  category?: string;
  page?: number;
  resultsPerPage?: number;
}

export interface JobSearchResult {
  jobs: Job[];
  totalResults: number;
  page: number;
  totalPages: number;
  source: string;
}