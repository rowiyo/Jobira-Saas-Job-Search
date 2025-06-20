'use client';

import { useState } from 'react';
import { useJoobleSearch } from '@/hooks/use-jooble-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Search, ExternalLink } from 'lucide-react';

export function JoobleSearch() {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const { search, loading, error, data } = useJoobleSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim()) return;
    
    await search({ keywords, location });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Jooble Job Search</h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Keywords (required)
            </label>
            <Input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., software engineer, marketing manager"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Location (optional)
            </label>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., New York, Remote"
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Jobs
              </>
            )}
          </Button>
        </form>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
            Error: {error}
          </div>
        )}
      </Card>
      
      {data && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Found {data.totalCount} jobs (showing {data.jobs.length})
          </div>
          
          {data.jobs.map((job: any, index: number) => (
            <Card key={job.id || index} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <p className="text-gray-600">{job.company}</p>
                    <p className="text-sm text-gray-500">{job.location}</p>
                  </div>
                  {job.salary && (
                    <div className="text-green-600 font-medium">
                      {job.salary}
                    </div>
                  )}
                </div>
                
                <p className="text-gray-700 line-clamp-2">{job.description}</p>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(job.postedDate).toLocaleDateString()}
                  </span>
                  <Button asChild size="sm">
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      View Job
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {data.totalCount > data.jobs.length && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => search({ 
                  keywords, 
                  location, 
                  page: (data.page || 1) + 1 
                })}
                disabled={loading}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}