'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ResumeUpload } from '@/components/resume/ResumeUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FileText, Search, User, Trash2, ChevronRight, Home, BarChart, Bell } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resumes, setResumes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [searchingJobs, setSearchingJobs] = useState<string | null>(null)
  const [deletingResume, setDeletingResume] = useState<string | null>(null)
  const [resumeToDelete, setResumeToDelete] = useState<{id: string, filename: string} | null>(null)
  const [searchResults, setSearchResults] = useState<{[key: string]: {
    status: 'success' | 'error',
    message: string,
    totalJobs?: number,
    jobBoardsSearched?: number,
    searchId?: string
  }}>({})
  const [searchProgress, setSearchProgress] = useState<number>(0)
  const [todayStats, setTodayStats] = useState<{jobsFound: number, searchesRun: number}>({jobsFound: 0, searchesRun: 0})
  const [activeResume, setActiveResume] = useState<any>(null)
  const [notifications, setNotifications] = useState<Array<{
    id: string,
    type: 'search_complete' | 'new_matches' | 'error',
    message: string,
    read: boolean,
    timestamp: Date
  }>>([])
  const [showNotifications, setShowNotifications] = useState(false)
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
      await loadTodayStats(session.user.id)
      setLoading(false)
    }

    getUser()
  }, [router])

  const loadResumes = async (userId: string) => {
    try {
      // First get resumes
      const { data: resumesData, error: resumesError } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('upload_date', { ascending: false })

      if (resumesError) {
        console.error('Error loading resumes:', resumesError)
        return
      }

      // Then get job search stats for each resume
      const resumesWithStats = await Promise.all(
        (resumesData || []).map(async (resume) => {
          // Get the most recent job search for this resume
          const { data: searchData } = await supabase
            .from('job_searches')
            .select('id, total_results, search_date')
            .eq('resume_id', resume.id)
            .order('search_date', { ascending: false })
            .limit(1)
            .single()

          if (searchData) {
            // Count unique job boards from search results
            const { data: jobBoardsData } = await supabase
              .from('job_search_results')
              .select('job_board')
              .eq('search_id', searchData.id)

            const uniqueJobBoards = new Set(jobBoardsData?.map(item => item.job_board) || [])

            return {
              ...resume,
              last_search_date: searchData.search_date,
              last_search_id: searchData.id,
              total_jobs_found: searchData.total_results || 0,
              job_boards_searched: uniqueJobBoards.size
            }
          }

          return {
            ...resume,
            last_search_date: null,
            last_search_id: null,
            total_jobs_found: 0,
            job_boards_searched: 0
          }
        })
      )

      setResumes(resumesWithStats)
    } catch (err) {
      console.error('Failed to load resumes:', err)
    }
  }

  const loadTodayStats = async (userId: string) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: todaySearches } = await supabase
        .from('job_searches')
        .select('total_results')
        .eq('user_id', userId)
        .gte('search_date', today.toISOString())
      
      const jobsFound = todaySearches?.reduce((sum, search) => sum + (search.total_results || 0), 0) || 0
      const searchesRun = todaySearches?.length || 0
      
      setTodayStats({ jobsFound, searchesRun })
    } catch (error) {
      console.error('Failed to load today stats:', error)
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
    setSearchProgress(0)
    
    // Set active resume
    const resume = resumes.find(r => r.id === resumeId)
    if (resume) {
      setActiveResume(resume)
    }
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setSearchProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 500)
    
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

      clearInterval(progressInterval)
      setSearchProgress(100)
      
      // Store the search results
      setSearchResults(prev => ({
        ...prev,
        [resumeId]: {
          status: 'success',
          message: `Found ${result.totalJobs} jobs across ${result.jobBoardsSearched} job boards!`,
          totalJobs: result.totalJobs,
          jobBoardsSearched: result.jobBoardsSearched,
          searchId: result.searchId
        }
      }))
      
      // Add notification
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'search_complete',
        message: `Search complete! Found ${result.totalJobs} jobs for "${resume?.filename}"`,
        read: false,
        timestamp: new Date()
      }, ...prev])
      
      if (user) {
        await loadResumes(user.id)
        await loadTodayStats(user.id)
      }

    } catch (error: any) {
      console.error('Job search error:', error)
      clearInterval(progressInterval)
      setSearchProgress(0)
      setSearchResults(prev => ({
        ...prev,
        [resumeId]: {
          status: 'error',
          message: `Job search failed: ${error.message}`
        }
      }))
    } finally {
      setSearchingJobs(null)
      setTimeout(() => setSearchProgress(0), 1000)
    }
  }

  const handleDeleteResume = async () => {
    if (!resumeToDelete) return
    
    setDeletingResume(resumeToDelete.id)
    
    try {
      // First, delete the file from storage
      const resume = resumes.find(r => r.id === resumeToDelete.id)
      if (resume?.file_path) {
        const { error: storageError } = await supabase.storage
          .from('resumes')
          .remove([resume.file_path])
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError)
        }
      }

      // Then, soft delete from database (set is_active to false)
      const { error: dbError } = await supabase
        .from('resumes')
        .update({ is_active: false })
        .eq('id', resumeToDelete.id)

      if (dbError) {
        throw dbError
      }

      // Reload resumes
      if (user) {
        await loadResumes(user.id)
      }

      // Show success message inline
      setSearchResults(prev => ({
        ...prev,
        [resumeToDelete.id]: {
          status: 'success',
          message: `Resume "${resumeToDelete.filename}" has been deleted successfully.`
        }
      }))
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setSearchResults(prev => {
          const newResults = { ...prev }
          delete newResults[resumeToDelete.id]
          return newResults
        })
      }, 3000)
      
    } catch (error: any) {
      console.error('Error deleting resume:', error)
      setSearchResults(prev => ({
        ...prev,
        [resumeToDelete.id]: {
          status: 'error',
          message: `Failed to delete resume: ${error.message}`
        }
      }))
    } finally {
      setDeletingResume(null)
      setResumeToDelete(null)
    }
  }

  const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/auth')
}

const markNotificationsAsRead = () => {
  setNotifications(prev => prev.map(n => ({ ...n, read: true })))
}

const unreadCount = notifications.filter(n => !n.read).length

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { name: 'Home', href: '/', icon: Home },
      { name: 'Dashboard', href: '/dashboard', icon: BarChart }
    ]
    
    if (activeTab !== 'overview') {
      const tabNames: { [key: string]: string } = {
        'upload': 'Upload Resume',
        'resumes': 'My Resumes',
        'search': 'Job Search'
      }
      breadcrumbs.push({
        name: tabNames[activeTab] || activeTab,
        href: `/dashboard#${activeTab}`,
        icon: activeTab === 'search' ? Search : FileText
      })
    }
    
    return breadcrumbs
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Loading dashboard...</p>
          {/* Click outside to close notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      {searchProgress > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${searchProgress}%` }}
            />
          </div>
        </div>
      )}
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="hover:opacity-80 transition-opacity">
            <img 
            src="/jobira_logo_sm.png" 
            alt="Jobira" 
            className="h-10 w-auto"
            />
</Link>
            <div className="flex items-center space-x-4">
              {/* Active Resume Indicator */}
              {activeResume && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Active:</span>
                  <span className="font-medium text-gray-900 max-w-[150px] truncate">
                    {activeResume.filename}
                  </span>
                </div>
              )}
              
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  <span className="font-medium">{todayStats.jobsFound}</span> jobs found today
                </div>
                <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
                  <span className="font-medium">{todayStats.searchesRun}</span> searches today
                </div>
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    if (!showNotifications) markNotificationsAsRead()
                  }}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500 text-center">No notifications yet</p>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.slice(0, 10).map((notification) => (
                            <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 h-2 w-2 rounded-full ${
                                  notification.read ? 'bg-gray-300' : 'bg-blue-500'
                                }`} />
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">{notification.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
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

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <nav className="flex items-center gap-2 text-sm">
          {getBreadcrumbs().map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
              <Link 
                href={crumb.href} 
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <crumb.icon className="h-3.5 w-3.5" />
                <span>{crumb.name}</span>
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>

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
                              <div className="flex-1">
                                <h3 className="font-medium">{resume.filename}</h3>
                                <p className="text-sm text-gray-500">
                                  Uploaded {new Date(resume.upload_date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Size: {Math.round(resume.file_size / 1024)} KB
                                </p>
                                
                                {/* Search Results Status */}
                                {searchResults[resume.id] && (
                                  <div className={`mt-2 p-3 rounded-md ${
                                    searchResults[resume.id].status === 'success' 
                                      ? 'bg-green-50 border border-green-200' 
                                      : 'bg-red-50 border border-red-200'
                                  }`}>
                                    <p className={`text-sm font-medium ${
                                      searchResults[resume.id].status === 'success'
                                        ? 'text-green-800'
                                        : 'text-red-800'
                                    }`}>
                                      {searchResults[resume.id].status === 'success' ? '✅' : '❌'} {searchResults[resume.id].message}
                                    </p>
                                    {searchResults[resume.id].status === 'success' && searchResults[resume.id].searchId && (
                                      <Button
                                        size="sm"
                                        variant="link"
                                        className="mt-2 p-0 h-auto text-green-700 hover:text-green-900"
                                        onClick={() => router.push(`/dashboard/results/${searchResults[resume.id].searchId}`)}
                                      >
                                        View job results →
                                      </Button>
                                    )}
                                  </div>
                                )}
                                
                                {/* Previous Search Info */}
                                {resume.total_jobs_found > 0 && !searchResults[resume.id] && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                    <p className="text-sm font-medium text-blue-700">
                                      📊 Last Search Results:
                                    </p>
                                    <p className="text-sm text-blue-600">
                                      {resume.total_jobs_found} jobs found across {resume.job_boards_searched} job boards
                                    </p>
                                    {resume.last_search_date && (
                                      <p className="text-sm text-blue-600">
                                        Searched on {new Date(resume.last_search_date).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                )}
                                
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
                              
                              {resume.total_jobs_found > 0 && resume.last_search_id && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                  onClick={() => router.push(`/dashboard/results/${resume.last_search_id}`)}
                              >
                                  View Results
                                </Button>
                              )}
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
                                  resume.total_jobs_found > 0 ? 'Search Again' : 'Search Jobs'
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => setResumeToDelete({id: resume.id, filename: resume.filename})}
                                disabled={deletingResume === resume.id}
                              >
                                {deletingResume === resume.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  </>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!resumeToDelete} onOpenChange={() => setResumeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resumeToDelete?.filename}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteResume}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}