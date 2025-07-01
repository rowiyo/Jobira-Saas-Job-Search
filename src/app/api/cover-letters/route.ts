// src/app/api/cover-letters/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET all cover letters for user
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('cover_letters')
      .select('*, resume:resumes(filename), job_result:job_search_results(job_title, company_name)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch cover letters' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST new cover letter
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      resumeId,
      jobResultId,
      content,
      companyName,
      jobTitle,
      status = 'draft'
    } = body

    const { data, error } = await supabase
      .from('cover_letters')
      .insert({
        user_id: session.user.id,
        resume_id: resumeId,
        job_result_id: jobResultId,
        title: `Cover Letter - ${jobTitle} at ${companyName}`,
        company_name: companyName,
        job_title: jobTitle,
        content,
        status
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create cover letter' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}