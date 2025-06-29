import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'

interface ResumeScore {
  overall: number
  sections: {
    contact: number
    experience: number
    education: number
    skills: number
    formatting: number
  }
  suggestions: string[]
}

interface ResumeScoreDisplayProps {
  score?: ResumeScore
  resumeData?: any
}

export function ResumeScoreDisplay({ score, resumeData }: ResumeScoreDisplayProps) {
  const [analyzedScore, setAnalyzedScore] = useState<ResumeScore | null>(null)

  // Analyze resume data to generate real score and suggestions
  const analyzeResume = (data: any): ResumeScore => {
    const suggestions: string[] = []
    let contactScore = 100
    let experienceScore = 100
    let educationScore = 100
    let skillsScore = 100
    let formattingScore = 100

    // Analyze Contact Information
    if (!data?.personalInfo?.email) {
      contactScore -= 25
      suggestions.push('Add email address to contact information')
    }
    if (!data?.personalInfo?.phone) {
      contactScore -= 25
      suggestions.push('Include phone number for better accessibility')
    }
    if (!data?.personalInfo?.linkedin) {
      contactScore -= 25
      suggestions.push('Add LinkedIn profile URL to boost professional presence')
    }
    if (!data?.personalInfo?.location) {
      contactScore -= 25
      suggestions.push('Specify location (city, state) for recruiter filtering')
    }

    // Analyze Professional Summary
    if (!data?.summary || data.summary.length < 50) {
      experienceScore -= 20
      suggestions.push('Write a compelling professional summary (2-3 sentences)')
    } else if (data.summary.length < 100) {
      experienceScore -= 10
      suggestions.push('Expand professional summary with key achievements')
    }

    // Analyze Experience Section
    if (data?.experience) {
      const totalJobs = data.experience.length
      
      // Check for quantified achievements
      let hasMetrics = false
      let hasActionVerbs = false
      const actionVerbs = ['led', 'managed', 'implemented', 'developed', 'achieved', 'increased', 'reduced', 'improved', 'created', 'designed']
      
      data.experience.forEach((job: any) => {
        // Check responsibilities for metrics
        job.responsibilities?.forEach((resp: string) => {
          if (/\d+%|\$\d+|\d+\+/.test(resp)) {
            hasMetrics = true
          }
          if (actionVerbs.some(verb => resp.toLowerCase().startsWith(verb))) {
            hasActionVerbs = true
          }
        })
        
        // Check if job has enough bullet points
        if (!job.responsibilities || job.responsibilities.length < 3) {
          experienceScore -= 5
        }
        
        // Check for employment gaps or missing dates
        if (!job.dates) {
          experienceScore -= 10
        }
      })
      
      if (!hasMetrics) {
        experienceScore -= 20
        suggestions.push('Add quantified achievements (e.g., "Increased sales by 25%")')
      }
      
      if (!hasActionVerbs) {
        experienceScore -= 15
        suggestions.push('Start bullet points with strong action verbs')
      }
      
      if (totalJobs < 2 && experienceScore > 70) {
        suggestions.push('Consider adding earlier positions or relevant projects')
      }
    } else {
      experienceScore = 0
      suggestions.push('Add professional experience section')
    }

    // Analyze Education
    if (!data?.education || data.education.length === 0) {
      educationScore -= 30
      suggestions.push('Include education section with degree information')
    } else {
      data.education.forEach((edu: any) => {
        if (!edu.degree || !edu.school) {
          educationScore -= 15
        }
      })
    }

    // Analyze Skills
    if (!data?.skills || data.skills.length === 0) {
      skillsScore = 0
      suggestions.push('Add relevant technical and soft skills')
    } else if (data.skills.length < 5) {
      skillsScore -= 30
      suggestions.push('Include more relevant skills (aim for 8-12)')
    } else if (data.skills.length < 8) {
      skillsScore -= 15
      suggestions.push('Add more technical skills relevant to your target role')
    }

    // Check for ATS-friendly formatting indicators
    if (data?.coreCompetencies && data.coreCompetencies.length > 0) {
      formattingScore += 5 // Bonus for having core competencies
    }
    
    if (data?.certifications && data.certifications.length > 0) {
      formattingScore += 5 // Bonus for certifications
      if (formattingScore > 100) formattingScore = 100
    } else {
      suggestions.push('Add relevant certifications to stand out')
    }

    // Industry-specific suggestions
    if (data?.experience?.[0]?.title?.toLowerCase().includes('qa') || 
        data?.experience?.[0]?.title?.toLowerCase().includes('quality')) {
      if (!data.skills?.some((skill: string) => 
        skill.toLowerCase().includes('automation') || 
        skill.toLowerCase().includes('selenium') ||
        skill.toLowerCase().includes('jira'))) {
        suggestions.push('Add QA-specific tools (Selenium, JIRA, TestRail)')
      }
    }

    // Calculate overall score
    const overall = Math.round(
      (contactScore * 0.15 + 
       experienceScore * 0.35 + 
       educationScore * 0.15 + 
       skillsScore * 0.25 + 
       formattingScore * 0.10)
    )

    // Sort suggestions by importance and limit to top 5
    const topSuggestions = suggestions.slice(0, 5)
    
    // If we have less than 5 suggestions, add some general ones
    const generalSuggestions = [
      'Use consistent formatting throughout the resume',
      'Keep resume to 1-2 pages for better readability',
      'Proofread for spelling and grammar errors',
      'Tailor resume keywords to target job descriptions',
      'Use bullet points instead of paragraphs',
      'Include industry-specific terminology',
      'Remove outdated skills or technologies',
      'Add volunteer work or side projects if relevant'
    ]
    
    while (topSuggestions.length < 5 && generalSuggestions.length > 0) {
      const suggestion = generalSuggestions.shift()
      if (suggestion && !topSuggestions.includes(suggestion)) {
        topSuggestions.push(suggestion)
      }
    }

    return {
      overall,
      sections: {
        contact: Math.max(0, contactScore),
        experience: Math.max(0, experienceScore),
        education: Math.max(0, educationScore),
        skills: Math.max(0, skillsScore),
        formatting: Math.max(0, formattingScore)
      },
      suggestions: topSuggestions
    }
  }

  useEffect(() => {
    if (resumeData) {
      const analyzed = analyzeResume(resumeData)
      setAnalyzedScore(analyzed)
    } else if (score) {
      setAnalyzedScore(score)
    }
  }, [resumeData, score])

  const displayScore = analyzedScore || score

  if (!displayScore) {
    return null
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Improvement'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resume Strength</span>
          <span className={`text-2xl font-bold ${getScoreColor(displayScore.overall)}`}>
            {displayScore.overall}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Score</span>
            <span className={`text-sm font-semibold ${getScoreColor(displayScore.overall)}`}>
              {getScoreLabel(displayScore.overall)}
            </span>
          </div>
          <Progress value={displayScore.overall} className="h-3" />
        </div>

        {/* Section Scores */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Section Breakdown</h4>
          
          {Object.entries(displayScore.sections).map(([section, score]) => (
            <div key={section} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm capitalize">{section}</span>
                <span className="text-sm text-gray-600">{score}%</span>
              </div>
              <Progress value={score} className="h-2" />
            </div>
          ))}
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top 5 Suggestions
          </h4>
          <ol className="space-y-2">
            {displayScore.suggestions.map((suggestion, index) => (
              <li key={index} className="flex gap-2 text-sm">
                <span className="text-gray-400 font-medium">{index + 1}.</span>
                <span className="text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Quick Actions */}
        {displayScore.overall < 80 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <AlertCircle className="h-4 w-4" />
              <span>Click "Optimize for ATS" to improve your score</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}