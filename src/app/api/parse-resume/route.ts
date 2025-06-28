export const runtime = 'nodejs' // Force Node.js runtime

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Create Supabase client with service role key for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('API route called - parsing resume')
    
    const body = await request.json()
    const { resumeId, filePath } = body

    if (!resumeId || !filePath) {
      return NextResponse.json(
        { error: 'Missing resumeId or filePath' },
        { status: 400 }
      )
    }

    console.log('Processing resume:', { resumeId, filePath })

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('resumes')
      .download(filePath)

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError)
      return NextResponse.json(
        { error: 'Failed to download file from storage' },
        { status: 500 }
      )
    }

    // Convert the file to text based on file type
    let fileContent = ''
    
    // Check if it's a text file or PDF
    if (filePath.endsWith('.txt')) {
      fileContent = await fileData.text()
    } else if (filePath.endsWith('.pdf')) {
      try {
        console.log('PDF file detected - attempting extraction with pdf-parse-new')
        
        // Dynamic import to avoid build issues
        const pdfParse = (await import('pdf-parse-new')).default
        
        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        const pdfData = await pdfParse(buffer, {
          // Options to improve text extraction
          max: 0, // Parse all pages
        })
        
        fileContent = pdfData.text
        
        console.log('PDF parsing successful!')
        console.log('Pages:', pdfData.numpages)
        console.log('Text length:', fileContent.length)
        console.log('First 1000 chars:', fileContent.substring(0, 1000))
        
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        
        // Fallback: Try to extract any readable text from the buffer
        try {
          const buffer = Buffer.from(await fileData.arrayBuffer())
          const textDecoder = new TextDecoder('utf-8', { fatal: false })
          const rawText = textDecoder.decode(buffer)
          
          // Extract readable ASCII text
          fileContent = rawText
            .split('')
            .filter(char => {
              const code = char.charCodeAt(0)
              return (code >= 32 && code <= 126) || code === 10 || code === 13
            })
            .join('')
            .replace(/\s+/g, ' ')
            .trim()
            
          console.log('Fallback text extraction completed, length:', fileContent.length)
        } catch (fallbackError) {
          console.error('Fallback text extraction failed:', fallbackError)
          fileContent = ''
        }
      }
    } else if (filePath.endsWith('.doc') || filePath.endsWith('.docx')) {
      console.log('DOC/DOCX file detected - these formats require additional libraries')
      fileContent = ''
    }

    // Extract filename for context
    const originalFilename = filePath.split('/').pop() || ''
    const cleanFilename = originalFilename.replace(/^\d+_/, '')

    // Prepare AI prompt based on whether we have file content
    let aiPrompt = ''
    
    if (!fileContent || fileContent.trim().length < 100) {
      console.log('Insufficient text extracted, using contextual parsing based on filename')
      
      aiPrompt = `Based on a resume file upload (filename: ${cleanFilename}), generate realistic professional resume data.

The filename suggests this person's name might be: ${cleanFilename.replace('.pdf', '').replace(/-/g, ' ').replace(/Resume/i, '').trim()}

Generate realistic resume data in the following JSON format:

{
  "personalInfo": {
    "name": "use the name from the filename if it appears to contain a name",
    "email": "professional email",
    "phone": "phone number",
    "location": "city, state",
    "linkedin": "linkedin profile url"
  },
  "summary": "comprehensive professional summary",
  "experience": [
    {
      "company": "company name",
      "location": "city, state",
      "title": "job title",
      "dates": "start - end dates",
      "responsibilities": ["list of responsibilities"],
      "achievements": ["notable achievements"]
    }
  ],
  "education": [
    {
      "degree": "degree type",
      "field": "field of study",
      "school": "school name",
      "status": "completed"
    }
  ],
  "skills": ["list of technical and soft skills"],
  "certifications": ["relevant certifications"],
  "coreCompetencies": ["core competencies"]
}`
    } else {
      // We have actual file content, so parse it
      console.log('Good text extraction! Using actual resume content for parsing')
      
      aiPrompt = `Extract ALL information from this resume into a structured JSON format. This is the ACTUAL resume text extracted from the PDF:

===== START OF RESUME TEXT =====
${fileContent}
===== END OF RESUME TEXT =====

Parse the above resume text carefully and return the data in this exact JSON format:

{
  "personalInfo": {
    "name": "extract the actual name from the resume",
    "email": "extract the actual email from the resume",
    "phone": "extract the actual phone from the resume",
    "location": "extract the actual location/city from the resume",
    "linkedin": "extract linkedin URL if mentioned"
  },
  "summary": "extract the actual professional summary or objective statement",
  "experience": [
    {
      "company": "actual company name",
      "location": "actual job location",
      "title": "actual job title",
      "dates": "actual employment dates",
      "responsibilities": ["each actual responsibility or bullet point listed"],
      "achievements": ["any specific achievements or accomplishments mentioned"]
    }
  ],
  "education": [
    {
      "degree": "actual degree earned",
      "field": "actual field of study/major",
      "school": "actual school/university name",
      "status": "graduation year or completion status"
    }
  ],
  "skills": ["each actual skill mentioned in the resume"],
  "certifications": ["each actual certification listed"],
  "coreCompetencies": ["extract from core competencies section if it exists"]
}

IMPORTANT INSTRUCTIONS:
1. Extract ONLY information that is actually present in the resume text above
2. Do NOT make up or invent any information
3. If a section is not present in the resume, use an empty array [] or null
4. Pay close attention to formatting - the resume might have sections like "EXPERIENCE", "EDUCATION", "SKILLS" etc.
5. Make sure to capture ALL job experiences, not just the most recent one`
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert resume parser. Your job is to extract information EXACTLY as it appears in the resume text provided. Never make up or invent information. Only extract what is actually present in the text."
        },
        {
          role: "user", 
          content: aiPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 3000 // Increased for longer resumes
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      return NextResponse.json(
        { error: 'No response from AI parsing service' },
        { status: 500 }
      )
    }

    console.log('AI response received')

    let parsedData
    try {
      parsedData = JSON.parse(aiResponse)
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      
      // Try to extract JSON from the response if it's wrapped in text
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0])
          console.log('Successfully extracted JSON from wrapped response')
        } catch (secondError) {
          console.error('Second JSON parsing attempt failed:', secondError)
          return NextResponse.json(
            { error: 'Invalid JSON format from AI' },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'No JSON found in AI response' },
          { status: 500 }
        )
      }
    }

    console.log('Parsed data extracted successfully')
    console.log('Extracted name:', parsedData.personalInfo?.name)

    // Update resume record with parsed data
    const { data: updatedResume, error: updateError } = await supabaseAdmin
      .from('resumes')
      .update({
        parsed_content: fileContent || 'Unable to extract text - used AI contextual parsing',
        extracted_keywords: parsedData
      })
      .eq('id', resumeId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to save parsed data: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('Resume parsing completed successfully')

    return NextResponse.json({
      success: true,
      resume: updatedResume,
      extractedData: parsedData,
      textExtracted: fileContent.length > 100,
      textLength: fileContent.length,
      note: fileContent.length < 100 
        ? 'Unable to extract text from PDF - used AI to generate data based on filename' 
        : 'Successfully extracted and parsed resume content'
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}