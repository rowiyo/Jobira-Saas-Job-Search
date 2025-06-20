import { useState, useCallback } from 'react';
import { JobSearchQuery, JobSearchResult, Job } from '@/types/job-api';

export function useJobSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<JobSearchResult | null>(null);

  const search = useCallback(async (query: JobSearchQuery, provider?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        keywords: query.keywords,
        ...(query.location && { location: query.location }),
        ...(query.remote && { remote: 'true' }),
        ...(query.salary_min && { salary_min: query.salary_min.toString() }),
        ...(query.salary_max && { salary_max: query.salary_max.toString() }),
        ...(query.job_type && { job_type: query.job_type }),
        ...(query.page && { page: query.page.toString() }),
        ...(query.resultsPerPage && { limit: query.resultsPerPage.toString() }),
        ...(provider && { provider }),
      });
      
      const response = await fetch(`/api/jobs/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults(data);
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    search,
    loading,
    error,
    results,
  };
}