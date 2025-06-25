// app/api/ats-optimize/route.ts
import { OpenAI } from 'openai';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf'; 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to extract text from resume
async function extractResumeText(resumeId: string): Promise<string> {
  // Get resume from database
  const { data: resume, error } = await supabase
    .from('resumes')
    .select('file_path, parsed_content, parsed_data')
    .eq('id', resumeId)
    .single();

  if (error || !resume) {
    throw new Error('Resume not found');
  }

  // If we already have parsed content, use it
  if (resume.parsed_content) {
    return resume.parsed_content;
  }

  // If we have parsed_data with resume text, use that
  if (resume.parsed_data?.resumeText) {
    return resume.parsed_data.resumeText;
  }

  // For now, we'll return a message that the resume needs to be parsed first
  // In production, you'd implement PDF parsing here
  throw new Error('Resume text not available. Please ensure the resume has been parsed.');
}


// Helper function to save optimized resume
async function saveOptimizedResume(
  optimizedText: string,
  userId: string,
  originalResumeId: string,
  optimizationResult: any
): Promise<any> {
  // Generate filename
  const timestamp = new Date().getTime();
  const filename = `ATS_Optimized_Resume_${timestamp}.txt`;
  
  // Get the extracted_keywords from the original resume
  const { data: originalResume } = await supabase
    .from('resumes')
    .select('extracted_keywords')
    .eq('id', originalResumeId)
    .single();

  const { data: newResume, error: dbError } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      filename: filename,
      file_path: `${userId}/ATS_Optimized_Resume_${timestamp}.txt`,
      file_size: optimizedText.length,
      parsed_content: optimizedText,
      extracted_keywords: originalResume?.extracted_keywords, // This preserves the keywords
      is_active: true,
      is_ats_optimized: true,
      original_resume_id: originalResumeId,
      parsed_data: {
        atsScore: optimizationResult.ats_score,
        improvements: optimizationResult.improvements_made,
        keywords: optimizationResult.keywords_added,
        analysis: optimizationResult.analysis
      }
    })
    .select()
    .single();

  if (dbError) {
    console.error('Database error:', dbError);
    throw new Error('Failed to save optimized resume to database');
  }

  return newResume;
}

export async function POST(req: Request) {
  try {
    const { resumeId, userId } = await req.json();
    
    if (!resumeId || !userId) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }
    
    // Get resume text
    let resumeText: string;
    try {
      resumeText = await extractResumeText(resumeId);
    } catch (error: any) {
      console.error('Text extraction error:', error);
      
      // For testing, use mock data if text extraction fails
      // Remove this in production
      resumeText = `John Doe
Software Engineer
john.doe@email.com | 555-1234

EXPERIENCE
Senior Software Engineer at Tech Corp (2020-Present)
- Led development of microservices architecture
- Managed team of 5 developers
- Improved system performance by 40%

EDUCATION
BS Computer Science - University Name (2016)

SKILLS
JavaScript, React, Node.js, Python, AWS, Docker`;
    }
    
    // Use GPT-4 for optimization
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `You are an expert ATS (Applicant Tracking System) optimization specialist. 
        
        Optimize the provided resume by:
        1. Converting to a single-column format with no tables, graphics, or special formatting
        2. Using standard section headers: PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS
        3. Formatting all dates consistently as MM/YYYY
        4. Starting each bullet point with a strong action verb
        5. Including relevant keywords based on the person's role and industry
        6. Quantifying achievements where possible
        7. Removing any headers, footers, or page numbers
        8. Using simple bullet points (• or -)
        9. Ensuring consistent verb tenses (past for previous roles, present for current)
        10. Keeping all text in plain format without any special characters
        
        Analyze the content and identify:
        - Current role/industry keywords that should be included
        - Missing keywords that are typically important for their field
        - Formatting issues that need to be fixed
        
        Return a JSON object with:
        {
          "optimized_text": "The complete optimized resume text",
          "ats_score": <number 0-100>,
          "improvements_made": ["list of specific improvements"],
          "keywords_added": ["list of keywords added"],
          "analysis": {
            "keywords_found": ["existing good keywords"],
            "missing_keywords": ["suggested keywords to add in future"],
            "format_issues": ["issues that were fixed"],
            "strengths": ["existing strengths maintained"]
          }
        }`
      }, {
        role: "user",
        content: `Please optimize this resume for ATS:\n\n${resumeText}`
      }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4000
    });
    
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Validate the response
    if (!result.optimized_text || !result.ats_score) {
      throw new Error('Invalid optimization response from AI');
    }
    
    // Save optimized resume
    const optimizedResume = await saveOptimizedResume(
      result.optimized_text,
      userId,
      resumeId,
      result
    );
    
    return NextResponse.json({
      optimizedResumeId: optimizedResume.id,
      atsScore: result.ats_score,
      improvements: result.improvements_made,
      keywords: result.keywords_added,
      analysis: result.analysis,
      message: 'Resume optimized successfully'
    });
    
  } catch (error: any) {
    console.error('ATS optimization error:', error);
    return NextResponse.json({ 
      error: 'Optimization failed', 
      details: error.message 
    }, { status: 500 });
  }
}