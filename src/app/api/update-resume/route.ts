// app/api/update-resume/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { resumeId, data } = await request.json()

    // Update the resume in your database
    const { error } = await supabaseAdmin
      .from('resumes')
      .update({
        extracted_keywords: data,
        updated_at: new Date().toISOString()
      })
      .eq('id', resumeId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 })
  }
}