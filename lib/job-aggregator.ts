import { RemoteOKProvider } from './job-providers/remoteok-provider';

export class JobAggregator {
  private providers: BaseJobProvider[] = [];
  
  constructor() {
    // Initialize all providers
    this.providers = [
      new RemoteOKProvider(), // Your existing provider
      new AdzunaProvider(),
      new JoobleProvider(),
      new CareerjetProvider(),
      new ArbeitnowProvider(),
      new TheirStackProvider(),
    ];
  }
  
  async searchAll(query: JobSearchQuery): Promise<Job[]> {
    const enabledProviders = this.providers.filter(p => p.enabled);
    
    // Search all providers in parallel
    const searchPromises = enabledProviders.map(provider => 
      provider.search(query).catch(error => {
        console.error(`Error searching ${provider.name}:`, error);
        return { jobs: [], totalResults: 0, page: 1, totalPages: 0, source: provider.name };
      })
    );
    
    const results = await Promise.all(searchPromises);
    
    // Combine and deduplicate jobs
    const allJobs = results.flatMap(result => result.jobs);
    return this.deduplicateJobs(allJobs);
  }
  
  async searchProvider(providerName: string, query: JobSearchQuery): Promise<JobSearchResult> {
    const provider = this.providers.find(p => p.name === providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    return provider.search(query);
  }
  
  private deduplicateJobs(jobs: Job[]): Job[] {
    const seen = new Map<string, Job>();
    
    for (const job of jobs) {
      // Create a unique key based on title, company, and location
      const key = `${job.title}-${job.company}-${job.location}`.toLowerCase();
      
      if (!seen.has(key)) {
        seen.set(key, job);
      } else {
        // If duplicate, prefer the one with more information
        const existing = seen.get(key)!;
        if (job.description.length > existing.description.length) {
          seen.set(key, job);
        }
      }
    }
    
    return Array.from(seen.values());
  }
  
  getProviders(): { name: string; enabled: boolean }[] {
    return this.providers.map(p => ({ name: p.name, enabled: p.enabled }));
  }
  
  enableProvider(name: string): void {
    const provider = this.providers.find(p => p.name === name);
    if (provider) provider.enabled = true;
  }
  
  disableProvider(name: string): void {
    const provider = this.providers.find(p => p.name === name);
    if (provider) provider.enabled = false;
  }
}