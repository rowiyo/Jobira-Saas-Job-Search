'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ResumeUpload } from '@/components/resume/ResumeUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Search, User } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resumes, setResumes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [searchingJobs, setSearchingJobs] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth')
        return
      }
      
      setUser(session.user)
      await loadResumes(session.user.id)
      setLoading(false)
    }

    getUser()
  }, [router])

  const loadResumes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('upload_date', { ascending: false })

      if (error) {
        console.error('Error loading resumes:', error)
      } else {
        setResumes(data || [])
      }
    } catch (err) {
      console.error('Failed to load resumes:', err)
    }
  }

  const handleUploadSuccess = (resume: any) => {
    if (user) {
      loadResumes(user.id)
    }
    setActiveTab('resumes')
  }

  const handleJobSearch = async (resumeId: string) => {
    setSearchingJobs(resumeId)
    
    try {
      console.log('Starting job search for resume:', resumeId)
      
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resumeId,
          userId: user.id,
          searchLocation: 'Massachusetts, USA'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Job search API error response:', errorText)
        throw new Error(`Job search failed (${response.status}): ${errorText.substring(0, 200)}`)
      }

      const result = await response.json()
console.log('Job search completed:', result)

// Handle test response format
alert(`🎉 Found ${result.totalJobs} jobs across ${result.jobBoardsSearched} job boards!

📍 Location: ${result.searchSummary.location}
🎯 Keywords: ${result.searchSummary.keywords.slice(0, 5).join(', ')}
💼 Job Title: ${result.searchSummary.jobTitle}
📊 Experience Level: ${result.searchSummary.experienceLevel}

Top Jobs:
${result.jobs.slice(0, 3).map((job, i) => `${i+1}. ${job.jobTitle} at ${job.company} (${job.location}) - ${job.salary || 'Salary not listed'}`).join('\n')}`)
      
      if (user) {
        await loadResumes(user.id)
      }

    } catch (error: any) {
      console.error('Job search error:', error)
      alert(`❌ Job search failed: ${error.message}`)
    } finally {
      setSearchingJobs(null)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Job Aggregator
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user.user_metadata?.first_name || user.email}!
              </span>
              <Button onClick={handleLogout} variant="destructive">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Upload Resume
              </TabsTrigger>
              <TabsTrigger value="resumes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                My Resumes ({resumes.length})
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Job Search
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setActiveTab('upload')}
                      className="w-full"
                      variant="default"
                    >
                      Upload Resume
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('search')}
                      className="w-full"
                      variant="secondary"
                    >
                      Search Jobs Manually
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('resumes')}
                      className="w-full"
                      variant="outline"
                      disabled={resumes.length === 0}
                    >
                      Resume-Based Search
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Resumes:</span>
                      <span className="font-semibold">{resumes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Parsed:</span>
                      <span className="font-semibold">
                        {resumes.filter(r => r.extracted_keywords).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Searches:</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jobs Found:</span>
                      <span className="font-semibold">0</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {resumes.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No activity yet. Upload a resume to get started!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {resumes.slice(0, 3).map((resume) => (
                          <div key={resume.id} className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="truncate">{resume.filename}</span>
                            {resume.extracted_keywords && (
                              <span className="text-green-600">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="upload">
              <ResumeUpload onUploadSuccess={handleUploadSuccess} />
            </TabsContent>

            <TabsContent value="resumes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Resumes</CardTitle>
                </CardHeader>
                <CardContent>
                  {resumes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes uploaded</h3>
                      <p className="text-gray-500 mb-4">Upload your first resume to get started with job searching.</p>
                      <Button onClick={() => setActiveTab('upload')}>
                        Upload Resume
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resumes.map((resume) => (
                        <div key={resume.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <FileText className="h-6 w-6 text-blue-600 mt-1" />
                              <div>
                                <h3 className="font-medium">{resume.filename}</h3>
                                <p className="text-sm text-gray-500">
                                  Uploaded {new Date(resume.upload_date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Size: {Math.round(resume.file_size / 1024)} KB
                                </p>
                                {resume.extracted_keywords && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-green-600">
                                      ✓ Parsed by AI
                                    </p>
                                    {resume.extracted_keywords.currentJobTitle && (
                                      <p className="text-sm text-gray-600">
                                        Current role: {resume.extracted_keywords.currentJobTitle}
                                      </p>
                                    )}
                                    {resume.extracted_keywords.searchKeywords && (
                                      <p className="text-sm text-gray-600">
                                        Keywords: {resume.extracted_keywords.searchKeywords.slice(0, 5).join(', ')}
                                        {resume.extracted_keywords.searchKeywords.length > 5 && ` +${resume.extracted_keywords.searchKeywords.length - 5} more`}
                                      </p>
                                    )}
                                    {resume.extracted_keywords.experienceLevel && (
                                      <p className="text-sm text-gray-600">
                                        Level: {resume.extracted_keywords.experienceLevel}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleJobSearch(resume.id)}
                                disabled={!resume.extracted_keywords || searchingJobs === resume.id}
                              >
                                {searchingJobs === resume.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Searching...
                                  </>
                                ) : (
                                  'Search Jobs'
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Job Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-center py-8">
                    Manual job search feature coming soon! For now, use the resume-based search in the "My Resumes" tab.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}