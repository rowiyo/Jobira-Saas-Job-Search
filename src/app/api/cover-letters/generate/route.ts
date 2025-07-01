// src/app/api/cover-letters/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication using getUser() for better security
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { companyName, jobTitle, jobDescription, resumeId, userName, tone = 'professional' } = body

    if (!companyName || !jobTitle) {
      return NextResponse.json(
        { error: 'Company name and job title are required' },
        { status: 400 }
      )
    }

    // Get user's name from profile if not provided
    let applicantName = userName
    if (!applicantName) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()
      
      if (profile?.first_name) {
        applicantName = profile.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile.first_name
      }
    }

    // Fetch resume content if resumeId is provided
    let resumeContent = ''
    if (resumeId) {
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('parsed_content')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .single()

      if (!resumeError && resume?.parsed_content) {
        resumeContent = resume.parsed_content
      }
    }

    // Check if we have OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found')
      
      // Return a better mock for development
      const mockContent = `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

${companyName}
Hiring Manager

Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${jobTitle} position at ${companyName}. With my comprehensive background and proven expertise, I am confident that I would make a valuable contribution to your team.

Throughout my career, I have consistently demonstrated the ability to deliver exceptional results. My experience encompasses a range of relevant skills and achievements that align perfectly with the requirements of this role. I am particularly drawn to ${companyName}'s reputation for innovation and excellence in the industry.

What sets me apart is my combination of technical expertise and strong interpersonal skills. I have successfully led cross-functional teams, managed complex projects, and consistently exceeded performance targets. I believe these experiences have prepared me well for the challenges and opportunities that come with the ${jobTitle} role at ${companyName}.

I am excited about the possibility of bringing my unique blend of skills and passion to your organization. I would welcome the opportunity to discuss how my background, skills, and enthusiasm can contribute to ${companyName}'s continued success.

Thank you for considering my application. I look forward to the possibility of speaking with you further about this exciting opportunity.

Sincerely,
${applicantName || '[Your Name]'}`

      return NextResponse.json({
        content: mockContent,
        success: true,
        mock: true
      })
    }

    // Use OpenAI to generate the cover letter
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const toneDescriptions = {
        professional: 'professional and formal, maintaining business etiquette',
        confident: 'confident and assertive, showcasing strong self-belief',
        friendly: 'friendly and conversational, warm yet professional',
        enthusiastic: 'passionate and enthusiastic, showing genuine excitement',
        humble: 'humble and appreciative, modest about achievements',
        direct: 'direct and concise, getting straight to the point',
        creative: 'creative and unique, standing out with originality',
        personal: 'personal and reflective, sharing authentic insights',
        persuasive: 'persuasive and compelling, focusing on value proposition'
      }

      const selectedTone = toneDescriptions[tone as keyof typeof toneDescriptions] || toneDescriptions.professional

      const systemPrompt = `You are an expert cover letter writer who creates highly personalized, compelling cover letters. Your cover letters are:
- Specific and tailored to each company and role
- Written in a ${selectedTone} tone
- Focused on value the candidate brings
- Free of generic phrases and clichés
- Never containing placeholder text or brackets`

      const userPrompt = `Write a professional cover letter for:

Company: ${companyName}
Position: ${jobTitle}
Applicant Name: ${applicantName || 'the applicant'}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

${jobDescription ? `Job Description:\n${jobDescription}\n` : ''}
${resumeContent ? `Applicant's Background/Resume:\n${resumeContent}\n` : ''}

Requirements:
1. Start with the date and company address
2. Use "Dear Hiring Manager" as the salutation
3. Write in a ${selectedTone} tone throughout
4. Write 4 paragraphs:
   - Opening: Express enthusiasm for the specific role and company
   - Body 1: Highlight 2-3 relevant experiences or achievements
   - Body 2: Explain why you're interested in this company specifically
   - Closing: Call to action and thank them
5. End with "Sincerely," and the applicant's name
6. Be specific - mention actual skills, technologies, or experiences
7. Show knowledge of the company when possible
8. Keep it under 400 words
9. Make every sentence count - no fluff or generic statements`

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // or 'gpt-4' if you have access
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })

      const generatedContent = completion.choices[0]?.message?.content || ''

      return NextResponse.json({
        content: generatedContent,
        success: true,
        mock: false
      })

    } catch (openAIError: any) {
      console.error('OpenAI API error:', openAIError)
      return NextResponse.json(
        { 
          error: 'Failed to generate cover letter', 
          details: openAIError.message 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}