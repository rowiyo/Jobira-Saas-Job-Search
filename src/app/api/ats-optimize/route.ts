import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeId, userId } = body

    if (!resumeId || !userId) {
      return NextResponse.json(
        { error: 'Missing resumeId or userId' },
        { status: 400 }
      )
    }

    console.log('🚀 Starting ATS optimization for resume:', resumeId)

    // Get the original resume data
    const { data: resume, error: resumeError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single()

    if (resumeError || !resume) {
      console.error('❌ Resume not found:', resumeError)
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // Get the original parsed data
    const originalKeywords = resume.extracted_keywords || {}
    const originalParsedData = resume.parsed_data || {}

    // ATS Optimization Logic
    const optimizedKeywords = {
      ...originalKeywords,
      // Add common ATS-friendly keywords based on the job title
      atsKeywords: generateATSKeywords(originalKeywords.currentJobTitle || ''),
      // Enhance skills with variations
      enhancedSkills: enhanceSkillsForATS(originalKeywords.skills || []),
      // Add action verbs
      actionVerbs: getActionVerbs(originalKeywords.experienceLevel || 'mid'),
      // Format for ATS
      formattedTitle: formatJobTitleForATS(originalKeywords.currentJobTitle || '')
    }

    // Create optimized resume content
    const optimizedContent = {
      ...originalParsedData,
      atsOptimized: true,
      optimizationDate: new Date().toISOString(),
      atsScore: calculateATSScore(optimizedKeywords),
      recommendations: generateRecommendations(originalKeywords),
      optimizedSections: {
        summary: generateOptimizedSummary(originalKeywords),
        skills: optimizedKeywords.enhancedSkills,
        keywords: optimizedKeywords.atsKeywords
      }
    }

    // Store the optimized version as a new resume entry
    const { data: optimizedResume, error: insertError } = await supabaseAdmin
      .from('resumes')
      .insert({
        user_id: userId,
        filename: `${resume.filename.replace('.pdf', '')}_ATS_Optimized.pdf`,
        file_path: resume.file_path, // Using same file for now
        file_size: resume.file_size,
        upload_date: new Date().toISOString(),
        extracted_keywords: optimizedKeywords,
        parsed_data: optimizedContent,
        is_active: true,
        is_ats_optimized: true,
        original_resume_id: resumeId
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Failed to create optimized resume:', insertError)
      return NextResponse.json(
        { error: 'Failed to create optimized resume' },
        { status: 500 }
      )
    }

    console.log('✅ ATS optimization completed:', optimizedResume.id)

    return NextResponse.json({
      success: true,
      optimizedResumeId: optimizedResume.id,
      atsScore: optimizedContent.atsScore,
      recommendations: optimizedContent.recommendations
    })

  } catch (error: any) {
    console.error('💥 ATS optimization error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions for ATS optimization

function generateATSKeywords(jobTitle: string): string[] {
  const keywordMap: { [key: string]: string[] } = {
    'software engineer': ['software development', 'programming', 'coding', 'SDLC', 'agile', 'scrum', 'git', 'CI/CD', 'debugging', 'testing'],
    'quality assurance': ['testing', 'QA', 'test automation', 'manual testing', 'bug tracking', 'test cases', 'regression testing', 'UAT', 'defect management'],
    'product manager': ['product development', 'roadmap', 'stakeholder management', 'user stories', 'backlog', 'product strategy', 'market analysis', 'KPIs'],
    'data scientist': ['machine learning', 'data analysis', 'Python', 'R', 'SQL', 'statistics', 'modeling', 'visualization', 'big data'],
    'designer': ['UI/UX', 'user experience', 'wireframing', 'prototyping', 'Figma', 'Adobe', 'user research', 'design systems']
  }

  const titleLower = jobTitle.toLowerCase()
  for (const [key, keywords] of Object.entries(keywordMap)) {
    if (titleLower.includes(key)) {
      return keywords
    }
  }

  // Default keywords
  return ['teamwork', 'communication', 'problem-solving', 'analytical', 'leadership', 'project management']
}

function enhanceSkillsForATS(skills: string[]): string[] {
  const enhancedSkills = [...skills]
  
  // Add variations and related skills
  const skillVariations: { [key: string]: string[] } = {
    'javascript': ['JavaScript', 'JS', 'ES6+', 'ECMAScript'],
    'python': ['Python', 'Python 3', 'Python3'],
    'react': ['React', 'ReactJS', 'React.js'],
    'node': ['Node', 'NodeJS', 'Node.js'],
    'sql': ['SQL', 'MySQL', 'PostgreSQL', 'Database']
  }

  skills.forEach(skill => {
    const skillLower = skill.toLowerCase()
    if (skillVariations[skillLower]) {
      enhancedSkills.push(...skillVariations[skillLower])
    }
  })

  return [...new Set(enhancedSkills)] // Remove duplicates
}

function getActionVerbs(level: string): string[] {
  const actionVerbs = {
    entry: ['Assisted', 'Supported', 'Contributed', 'Participated', 'Learned'],
    mid: ['Developed', 'Implemented', 'Managed', 'Designed', 'Improved', 'Optimized'],
    senior: ['Led', 'Architected', 'Strategized', 'Mentored', 'Established', 'Transformed'],
    executive: ['Directed', 'Spearheaded', 'Orchestrated', 'Championed', 'Pioneered']
  }

  return actionVerbs[level] || actionVerbs.mid
}

function formatJobTitleForATS(title: string): string {
  // Remove special characters and standardize
  return title
    .replace(/[^\w\s]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim()
}

function calculateATSScore(keywords: any): number {
  let score = 50 // Base score

  // Add points for various factors
  if (keywords.currentJobTitle) score += 10
  if (keywords.skills && keywords.skills.length > 5) score += 10
  if (keywords.searchKeywords && keywords.searchKeywords.length > 10) score += 10
  if (keywords.atsKeywords && keywords.atsKeywords.length > 5) score += 10
  if (keywords.actionVerbs && keywords.actionVerbs.length > 0) score += 10

  return Math.min(score, 95) // Cap at 95
}

function generateRecommendations(keywords: any): string[] {
  const recommendations = []

  if (!keywords.currentJobTitle) {
    recommendations.push('Add a clear job title at the top of your resume')
  }

  if (!keywords.skills || keywords.skills.length < 5) {
    recommendations.push('Include more relevant technical skills')
  }

  if (!keywords.searchKeywords || keywords.searchKeywords.length < 10) {
    recommendations.push('Add more industry-specific keywords')
  }

  recommendations.push('Use standard section headings (Experience, Education, Skills)')
  recommendations.push('Avoid graphics, images, or complex formatting')
  recommendations.push('Use bullet points to describe achievements')

  return recommendations
}

function generateOptimizedSummary(keywords: any): string {
  const title = keywords.currentJobTitle || 'Professional'
  const level = keywords.experienceLevel || 'Experienced'
  const skills = keywords.skills?.slice(0, 3).join(', ') || 'various technical skills'

  return `${level} ${title} with expertise in ${skills}. Proven track record of delivering high-quality results and driving team success.`
}