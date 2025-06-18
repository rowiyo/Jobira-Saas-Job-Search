// pages/search/[searchId].js - Search results page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SearchResults() {
  const router = useRouter();
  const { searchId } = router.query;
  
  const [searchData, setSearchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);

  // Fetch search results
  const fetchResults = async () => {
    if (!searchId) return;

    try {
      const response = await fetch(`/api/search/${searchId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch results');
      }

      setSearchData(data);
      setLoading(false);

      // Stop polling if search is completed or failed
      if (data.search.status === 'completed' || data.search.status === 'failed') {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }

    } catch (err) {
      console.error('❌ Error fetching results:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Start polling for results
  useEffect(() => {
    if (searchId && !pollingInterval) {
      // Initial fetch
      fetchResults();

      // Poll every 3 seconds if search is still pending/in progress
      const interval = setInterval(() => {
        fetchResults();
      }, 3000);

      setPollingInterval(interval);

      // Cleanup
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [searchId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  if (loading && !searchData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading search results...</h2>
          <p className="text-gray-600">This may take 30-60 seconds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-2 text-sm underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!searchData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No search data found</h2>
        </div>
      </div>
    );
  }

  const { search, summary, jobs } = searchData;

  // Status indicator component
  const StatusIndicator = ({ status }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Searching...', icon: '⏳' },
      in_progress: { color: 'bg-blue-100 text-blue-800', text: 'In Progress...', icon: '🔍' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed', icon: '✅' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed', icon: '❌' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {search.jobTitle} in {search.location}
          </h1>
          <StatusIndicator status={search.status} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Work Type:</span> {search.locationType || 'Any'}
          </div>
          <div>
            <span className="font-medium">Total Results:</span> {search.totalResults || 0}
          </div>
          <div>
            <span className="font-medium">Search Date:</span> {new Date(search.searchDate).toLocaleDateString()}
          </div>
        </div>

        {search.keywords && search.keywords.length > 0 && (
          <div className="mt-3">
            <span className="text-sm font-medium text-gray-700">Keywords: </span>
            <div className="inline-flex flex-wrap gap-1 mt-1">
              {search.keywords.map((keyword, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {summary && summary.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Results by Job Board</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.map((boardSummary) => (
              <div key={boardSummary.jobBoard} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{boardSummary.jobBoard}</h3>
                <p className="text-2xl font-bold text-blue-600">{boardSummary.count}</p>
                <p className="text-sm text-gray-500">jobs found</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Listings */}
      {jobs && jobs.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Job Listings ({jobs.length} found)
            </h2>
          </div>
          
          <div className="divide-y">
            {jobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                    {job.job_url ? (
                      <a 
                        href={job.job_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {job.job_title}
                      </a>
                    ) : (
                      job.job_title
                    )}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {job.job_board}
                    </span>
                    {job.relevance_score && (
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {Math.round(job.relevance_score * 100)}% match
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-gray-600 mb-2">
                  <span className="font-medium">{job.company_name}</span>
                  {job.location && <span className="ml-2">• {job.location}</span>}
                  {job.salary_range && <span className="ml-2">• {job.salary_range}</span>}
                </div>
                
                {job.job_description && (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {job.job_description.substring(0, 300)}
                    {job.job_description.length > 300 && '...'}
                  </p>
                )}

                <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                  <span>Posted: {job.posted_date || 'Recently'}</span>
                  {job.job_url && (
                    <a 
                      href={job.job_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Job →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : search.status === 'completed' ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or searching for different keywords.
          </p>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Modify Search
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-pulse">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Searching for jobs...</h3>
            <p className="text-gray-600">
              We're scanning job boards for the best matches. This usually takes 30-60 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button 
          onClick={fetchResults}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh Results
        </button>
      </div>
    </div>
  );
}