import { NextRequest, NextResponse } from 'next/server';
import { JobAggregator } from '@/lib/job-aggregator';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

const jobAggregator = new JobAggregator();

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    const searchParams = req.nextUrl.searchParams;
    
    const query = {
      keywords: searchParams.get('keywords') || '',
      location: searchParams.get('location') || undefined,
      remote: searchParams.get('remote') === 'true',
      salary_min: searchParams.get('salary_min') ? parseInt(searchParams.get('salary_min')!) : undefined,
      salary_max: searchParams.get('salary_max') ? parseInt(searchParams.get('salary_max')!) : undefined,
      job_type: searchParams.get('job_type') || undefined,
      category: searchParams.get('category') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      resultsPerPage: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };
    
    const provider = searchParams.get('provider');
    
    let result;
    if (provider) {
      // Search specific provider
      result = await jobAggregator.searchProvider(provider, query);
    } else {
      // Search all providers
      const jobs = await jobAggregator.searchAll(query);
      
      // Apply pagination to combined results
      const start = (query.page - 1) * query.resultsPerPage;
      const paginatedJobs = jobs.slice(start, start + query.resultsPerPage);
      
      result = {
        jobs: paginatedJobs,
        totalResults: jobs.length,
        page: query.page,
        totalPages: Math.ceil(jobs.length / query.resultsPerPage),
        sources: jobAggregator.getProviders().filter(p => p.enabled).map(p => p.name)
      };
    }
    
    // Log search if user is authenticated
    if (userId) {
      await db.searchHistory.create({
        data: {
          userId,
          query: query.keywords,
          location: query.location,
          filters: {
            remote: query.remote,
            salary_min: query.salary_min,
            job_type: query.job_type,
          },
          resultsCount: result.totalResults,
          providers: provider ? [provider] : result.sources,
        },
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Job search error:', error);
    return NextResponse.json(
      { error: 'Failed to search jobs' },
      { status: 500 }
    );
  }