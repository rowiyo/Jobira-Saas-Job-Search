export abstract class BaseJobProvider {
  abstract name: string;
  abstract enabled: boolean;
  protected apiKey?: string;
  protected baseUrl: string = '';
  
  abstract search(query: JobSearchQuery): Promise<JobSearchResult>;
  
  protected async fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  protected normalizeJob(rawJob: any, source: string): Job {
    return {
      id: rawJob.id || `${source}-${Date.now()}-${Math.random()}`,
      title: rawJob.title || '',
      company: rawJob.company || '',
      location: rawJob.location || '',
      description: rawJob.description || '',
      url: rawJob.url || '',
      source,
      postedDate: new Date(rawJob.created || rawJob.date || Date.now()),
      remote: false,
      tags: []
    };
  }
}