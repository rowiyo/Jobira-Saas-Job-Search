import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resumeId = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!resumeId) {
      return NextResponse.json({ error: 'Missing resume ID' }, { status: 400 })
    }

    // Build query
    let query = supabaseAdmin
      .from('resumes')
      .select('file_path, filename, user_id')
      .eq('id', resumeId)

    // If userId is provided, add it to the query for security
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: resume, error } = await query.single()

    if (error || !resume) {
      console.error('Resume not found:', error)
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // Download from storage
    const { data, error: downloadError } = await supabaseAdmin
      .storage
      .from('resumes')
      .download(resume.file_path)

    if (downloadError || !data) {
      console.error('Download error:', downloadError)
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await data.arrayBuffer())

    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resume.filename}"`,
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}