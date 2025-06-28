import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { resumeId, templateId, userId } = await req.json()

    // Get resume data
    const { data: resume } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single()

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // Calculate resume score
    const score = calculateResumeScore(resume.extracted_keywords)

    // Convert to template format
    const convertedContent = await convertToTemplate(resume, templateId)

    // Save converted resume
    /*const { data: converted, error: insertError } = await supabase
      .from('converted_resumes')
      .insert({
        user_id: userId,
        original_resume_id: resumeId,
        template_id: templateId,
        content: convertedContent,
        score: JSON.stringify(score),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
    }*/

    return NextResponse.json({
      success: true,
      convertedResumeId: resumeId,
      score: score,
      content: convertedContent
    })

  } catch (error) {
    console.error('Conversion error:', error)
    return NextResponse.json({ error: 'Failed to convert resume' }, { status: 500 })
  }
}

function calculateResumeScore(keywords: any) {
  const score = {
    overall: 0,
    sections: {
      contact: keywords?.email ? 90 : 50,
      experience: keywords?.experienceYears > 2 ? 80 : 60,
      education: keywords?.education ? 75 : 50,
      skills: keywords?.skills?.length > 5 ? 85 : 60,
      formatting: 70
    },
    suggestions: []
  }

  const sectionScores = Object.values(score.sections)
  score.overall = Math.round(sectionScores.reduce((a, b) => a + b) / sectionScores.length)

  if (score.sections.skills < 70) {
    score.suggestions.push('Add more relevant technical skills')
  }

  return score
}

async function convertToTemplate(resume: any, templateId: string) {
  console.log('Resume data:', resume)
  console.log('Keywords:', resume.extracted_keywords)
  
  const keywords = resume.extracted_keywords || {}
  const personalInfo = keywords.personalInfo || {}
  const experience = keywords.experience || []
  const education = keywords.education || []
  const skills = keywords.skills || []

  if (templateId.includes('text')) {
    return `${personalInfo.name || 'Your Name'}
${personalInfo.email || 'email@example.com'} | ${personalInfo.phone || '(555) 123-4567'}
${personalInfo.location || 'City, State'}

PROFESSIONAL SUMMARY
${keywords.summary || 'Add your professional summary'}

CORE COMPETENCIES
${keywords.coreCompetencies?.join(' • ') || skills.join(' • ') || 'Add your skills here'}

PROFESSIONAL EXPERIENCE
${experience.map(job => `
${job.title} at ${job.company}
${job.dates} | ${job.location || ''}
${job.responsibilities?.map(resp => `• ${resp}`).join('\n') || ''}
`).join('\n') || '[Your detailed work history will appear here]'}

EDUCATION
${education.map(edu => `
${edu.degree} in ${edu.field}
${edu.school}${edu.status ? ' - ' + edu.status : ''}
`).join('\n') || 'Add education'}

SKILLS
${skills.join(' • ') || 'Add your skills'}

CERTIFICATIONS
${keywords.certifications?.join(', ') || 'Add certifications'}
`
  }
  
  // HTML template would need similar fixes
  return `<html>...</html>`
}