import { useState } from 'react';

interface JoobleSearchParams {
  keywords: string;
  location?: string;
  page?: number;
  salary?: string;
}

export function useJoobleSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const search = async (params: JoobleSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        keywords: params.keywords,
        ...(params.location && { location: params.location }),
        ...(params.page && { page: params.page.toString() }),
        ...(params.salary && { salary: params.salary }),
      });

      const response = await fetch(`/api/jobs/jooble?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const result = await response.json();
      setData(result);
      return result;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { search, loading, error, data };
}