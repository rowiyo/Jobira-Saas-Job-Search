'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Download, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  FileText,
  Sparkles,
  Target,
  BarChart3,
  Zap,
  Shield,
  AlertTriangle,
  Eye,
  Copy,
  Share2,
  RefreshCw
} from 'lucide-react'

interface ATSResult {
  id: string
  original_resume_id: string
  optimized_resume_id: string
  ats_score: number
  previous_score: number
  optimization_date: string
  resume_data: {
    filename: string
    original_filename: string
  }
  analysis: {
    keywords_found: string[]
    missing_keywords: string[]
    format_issues: string[]
    strengths: string[]
    improvements_made: string[]
  }
  recommendations: {
    high_priority: string[]
    medium_priority: string[]
    low_priority: string[]
  }
  section_scores: {
    formatting: number
    keywords: number
    experience: number
    skills: number
    education: number
  }
}

export default function ATSResultsPage() {
  const params = useParams()
  const router = useRouter()
  const resumeId = params.resumeId as string // This is correct

  console.log('ATS Results Page - resumeId:', resumeId)
  console.log('ATS Results Page - params:', params)
  console.log('ATS Results Page - Full URL:', window.location.href)

  const [loading, setLoading] = useState(true)
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    loadATSResults()
  }, [resumeId])

  const loadATSResults = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      // Load the optimized resume and its analysis
      const { data: resumeData, error } = await supabase
        .from('resumes')
        .select(`
          *,
          original_resume:original_resume_id(
            filename,
            parsed_data
          )
        `)
        .eq('id', resumeId)
        .eq('user_id', session.user.id)
        .single()

      if (error || !resumeData) {
        console.error('Error loading ATS results:', error)
        router.push('/dashboard')
        return
      }

      // Mock ATS analysis data - in production, this would come from your database
      const mockResult: ATSResult = {
        id: resumeId,
        original_resume_id: resumeData.original_resume_id,
        optimized_resume_id: resumeId,
        ats_score: resumeData.parsed_data?.atsScore || 92,
        previous_score: 65,
        optimization_date: resumeData.upload_date,
        resume_data: {
          filename: resumeData.filename,
          original_filename: resumeData.original_resume?.filename || 'Original Resume'
        },
        analysis: {
          keywords_found: [
            'project management', 'agile', 'scrum', 'leadership', 
            'data analysis', 'stakeholder management', 'budget planning'
          ],
          missing_keywords: [
            'KPI tracking', 'risk assessment', 'cross-functional teams'
          ],
          format_issues: [
            'Complex formatting removed', 
            'Graphics and images eliminated',
            'Two-column layout converted to single column'
          ],
          strengths: [
            'Strong action verbs used throughout',
            'Quantifiable achievements included',
            'Clear section headers',
            'Consistent date formatting'
          ],
          improvements_made: [
            'Added 15 industry-specific keywords',
            'Restructured experience section with bullet points',
            'Standardized formatting for ATS parsing',
            'Optimized skills section placement',
            'Enhanced keyword density without stuffing'
          ]
        },
        recommendations: {
          high_priority: [
            'Add more quantifiable metrics to recent roles',
            'Include industry certifications in a dedicated section',
            'Expand on technical skills with proficiency levels'
          ],
          medium_priority: [
            'Consider adding a brief professional summary',
            'Include more collaborative project examples',
            'Add relevant online course completions'
          ],
          low_priority: [
            'Update LinkedIn profile to match resume',
            'Consider industry-specific resume variations',
            'Add professional association memberships'
          ]
        },
        section_scores: {
          formatting: 95,
          keywords: 88,
          experience: 92,
          skills: 85,
          education: 90
        }
      }

      setAtsResult(mockResult)
    } catch (error) {
      console.error('Failed to load ATS results:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!atsResult) return
    
    setDownloading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      window.open(
        `/api/download-resume?id=${atsResult.optimized_resume_id}&userId=${session.user.id}`, 
        '_blank'
      )
    } catch (error) {
      console.error('Download error:', error)
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyTips = () => {
    const tips = atsResult?.recommendations.high_priority.join('\n') || ''
    navigator.clipboard.writeText(tips)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-50'
    if (score >= 75) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600">Analyzing your optimized resume...</p>
        </div>
      </div>
    )
  }

  if (!atsResult) return null

  const scoreImprovement = atsResult.ats_score - atsResult.previous_score

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ATS Optimization Results</h1>
                <p className="text-sm text-gray-600">
                  {atsResult.resume_data.filename} • Optimized on {new Date(atsResult.optimization_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTips}
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Tips
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {downloading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Optimized Resume
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Score Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">ATS Score Analysis</h2>
                  <p className="text-blue-100">Your resume is now optimized for applicant tracking systems</p>
                </div>
                <Shield className="h-12 w-12 text-white/20" />
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-blue-100 text-sm mb-2">Previous Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{atsResult.previous_score}%</span>
                    <Badge variant="secondary" className="bg-white/20 text-white">Before</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-2">Optimized Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">{atsResult.ats_score}%</span>
                    <Badge className="bg-green-500 text-white">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{scoreImprovement}%
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Progress 
                value={atsResult.ats_score} 
                className="mt-4 h-3 bg-white/20"
              />
            </div>
            
            <CardContent className="pt-6">
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(atsResult.section_scores).map(([section, score]) => (
                  <div key={section} className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBg(score)} mb-2`}>
                      <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}%</span>
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{section}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Sparkles className="h-5 w-5" />
                Key Improvements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {atsResult.analysis.improvements_made.slice(0, 4).map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="keywords" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="keywords" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="formatting" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Formatting
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-900">Keywords Found</CardTitle>
                  <CardDescription>These high-value keywords were successfully integrated</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {atsResult.analysis.keywords_found.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="bg-green-100 text-green-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-900">Missing Keywords</CardTitle>
                  <CardDescription>Consider adding these keywords in future updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {atsResult.analysis.missing_keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="bg-orange-100 text-orange-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <Alert className="mt-4 border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-sm text-gray-700">
                      Add these keywords naturally within your experience descriptions for better ATS matching.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="formatting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formatting Optimizations</CardTitle>
                <CardDescription>Changes made to ensure ATS compatibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      Issues Fixed
                    </h4>
                    <ul className="space-y-2">
                      {atsResult.analysis.format_issues.map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-red-500 mt-0.5">•</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Strengths Maintained
                    </h4>
                    <ul className="space-y-2">
                      {atsResult.analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-green-500 mt-0.5">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    High Priority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {atsResult.recommendations.high_priority.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-yellow-900 flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Medium Priority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {atsResult.recommendations.medium_priority.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Nice to Have
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {atsResult.recommendations.low_priority.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Before vs After Comparison</CardTitle>
                <CardDescription>Visual representation of your resume improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(atsResult.section_scores).map(([section, score]) => {
                    const previousScore = Math.max(20, score - 20 - Math.random() * 10)
                    return (
                      <div key={section}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium capitalize">{section}</span>
                          <span className="text-sm text-gray-500">
                            {Math.round(previousScore)}% → {score}%
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gray-400 transition-all duration-500"
                              style={{ width: `${previousScore}%` }}
                            />
                          </div>
                          <div className="absolute top-0 h-8 rounded-full overflow-hidden" style={{ width: '100%' }}>
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Alert className="border-blue-200 bg-blue-50">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong className="text-gray-900">Pro Tip:</strong> Re-optimize your resume every 3-6 months to stay current with ATS algorithms and industry keywords.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}