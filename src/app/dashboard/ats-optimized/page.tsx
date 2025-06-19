'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  CheckCircle, 
  Download, 
  ArrowLeft, 
  Star, 
  AlertCircle,
  FileText,
  Target,
  TrendingUp,
  Eye
} from 'lucide-react'

interface OptimizedResume {
  id: string
  filename: string
  file_path: string
  extracted_keywords: any
  upload_date: string
  is_ats_optimized: boolean
  original_resume_id: string
}

interface ATSResults {
  atsScore: number
  recommendations: string[]
  optimizedSections: {
    summary: string
    skills: string[]
    keywords: string[]
  }
}

export default function ATSOptimizedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null)
  const [atsResults, setATSResults] = useState<ATSResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadOptimizedResume()
  }, [])

  const loadOptimizedResume = async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/auth')
        return
      }
      setUser(currentUser)

      // Get the most recent ATS optimized resume for this user
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('is_ats_optimized', true)
        .eq('is_active', true)
        .order('upload_date', { ascending: false })
        .limit(1)
        .single()

      if (resumeError || !resume) {
        console.error('No optimized resume found:', resumeError)
        setError('No optimized resume found. Please try optimizing a resume first.')
        return
      }

      setOptimizedResume(resume)

      // Extract ATS results from the resume data
      const keywords = resume.extracted_keywords || {}
      const atsResults: ATSResults = {
        atsScore: calculateATSScore(keywords),
        recommendations: generateRecommendations(keywords),
        optimizedSections: {
          summary: keywords.optimizedSummary || generateOptimizedSummary(keywords),
          skills: keywords.enhancedSkills || keywords.skills || [],
          keywords: keywords.atsKeywords || []
        }
      }

      setATSResults(atsResults)

    } catch (error: any) {
      console.error('Error loading optimized resume:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!optimizedResume) return

    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(optimizedResume.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = optimizedResume.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Download error:', error)
      alert('Failed to download resume')
    }
  }

  const handleViewResume = () => {
    router.push('/dashboard?tab=resumes')
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  // Helper functions
  const calculateATSScore = (keywords: any): number => {
    let score = 50 // Base score

    if (keywords.currentJobTitle) score += 10
    if (keywords.skills && keywords.skills.length > 5) score += 10
    if (keywords.searchKeywords && keywords.searchKeywords.length > 10) score += 10
    if (keywords.atsKeywords && keywords.atsKeywords.length > 5) score += 10
    if (keywords.actionVerbs && keywords.actionVerbs.length > 0) score += 10

    return Math.min(score, 95)
  }

  const generateRecommendations = (keywords: any): string[] => {
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

  const generateOptimizedSummary = (keywords: any): string => {
    const title = keywords.currentJobTitle || 'Professional'
    const level = keywords.experienceLevel || 'Experienced'
    const skills = keywords.skills?.slice(0, 3).join(', ') || 'various technical skills'

    return `${level} ${title} with expertise in ${skills}. Proven track record of delivering high-quality results and driving team success.`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your optimized resume...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ATS Optimization Complete!</h1>
              <p className="text-gray-600 mt-2">Your resume has been optimized for Applicant Tracking Systems</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>

        {/* ATS Score Card */}
        {atsResults && (
          <div className={`${getScoreBgColor(atsResults.atsScore)} rounded-lg p-6 mb-8`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">ATS Compatibility Score</h2>
                <p className="text-gray-600">How well your resume will perform with ATS systems</p>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(atsResults.atsScore)}`}>
                  {atsResults.atsScore}%
                </div>
                <div className="flex items-center justify-center mt-1">
                  <Star className={`h-4 w-4 ${getScoreColor(atsResults.atsScore)}`} />
                  <span className="text-sm text-gray-600 ml-1">ATS Score</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Resume Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Optimized Resume
            </h3>
            
            {optimizedResume && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Filename</p>
                  <p className="font-medium">{optimizedResume.filename}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Optimized Date</p>
                  <p className="font-medium">
                    {new Date(optimizedResume.upload_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                  
                  <button
                    onClick={handleViewResume}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {atsResults && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Optimization Recommendations
              </h3>
              
              <div className="space-y-3">
                {atsResults.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Optimized Sections */}
        {atsResults && (
          <div className="mt-8 space-y-6">
            {/* Enhanced Skills */}
            {atsResults.optimizedSections.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Enhanced Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {atsResults.optimizedSections.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ATS Keywords */}
            {atsResults.optimizedSections.keywords.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ATS-Friendly Keywords Added
                </h3>
                <div className="flex flex-wrap gap-2">
                  {atsResults.optimizedSections.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Optimized Summary */}
            {atsResults.optimizedSections.summary && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Optimized Professional Summary
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 italic">"{atsResults.optimizedSections.summary}"</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Next Steps</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Download your optimized resume</li>
            <li>• Use this version when applying through ATS systems</li>
            <li>• Consider the recommendations for future improvements</li>
            <li>• Test with different job postings to maximize compatibility</li>
          </ul>
        </div>
      </div>
    </div>
  )
}