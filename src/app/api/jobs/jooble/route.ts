import { NextRequest, NextResponse } from 'next/server';
import { JoobleService } from '@/lib/jooble-service';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    
    // Get search parameters
    const keywords = searchParams.get('keywords') || '';
    const location = searchParams.get('location') || '';
    const page = searchParams.get('page') || '1';
    const salary = searchParams.get('salary') || undefined;
    
    if (!keywords) {
      return NextResponse.json(
        { error: 'Keywords are required' },
        { status: 400 }
      );
    }

    // Initialize Jooble service
    const joobleApiKey = process.env.JOOBLE_API_KEY;
    if (!joobleApiKey) {
      throw new Error('JOOBLE_API_KEY not configured');
    }

    const jooble = new JoobleService(joobleApiKey);
    
    // Search jobs
    const response = await jooble.searchJobs({
      keywords,
      location,
      page,
      salary,
      resultsOnPage: '20',
    });

    // Format response
    const formattedJobs = response.jobs.map(job => ({
      id: job.id || `jooble-${Date.now()}-${Math.random()}`,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.snippet,
      salary: job.salary,
      url: job.link,
      source: 'Jooble',
      type: job.type,
      postedDate: job.updated,
    }));

    return NextResponse.json({
      success: true,
      totalCount: response.totalCount,
      page: parseInt(page),
      jobs: formattedJobs,
    });

  } catch (error) {
    console.error('Jooble API error:', error);
    return NextResponse.json(
      { error: 'Failed to search jobs' },
      { status: 500 }
    );
  }
}