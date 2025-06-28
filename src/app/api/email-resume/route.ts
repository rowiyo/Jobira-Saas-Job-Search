// /src/app/api/email-resume/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, resumeData } = await request.json()

    // Convert resume data to HTML
    const resumeHTML = `
      <h1>${resumeData.personalInfo.name}</h1>
      <p>${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.location}</p>
      
      <h2>Professional Summary</h2>
      <p>${resumeData.summary}</p>
      
      <h2>Experience</h2>
      ${resumeData.experience.map(exp => `
        <h3>${exp.title} at ${exp.company}</h3>
        <p>${exp.dates} | ${exp.location}</p>
        <ul>
          ${exp.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
        </ul>
      `).join('')}
      
      <!-- Add more sections as needed -->
    `

    const { data, error } = await resend.emails.send({
      from: 'Resume Builder <onboarding@resend.dev>', // Use your domain
      to: email,
      subject: 'Your Resume',
      html: resumeHTML,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}