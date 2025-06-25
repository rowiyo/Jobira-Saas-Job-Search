'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ResumeUpload } from '@/components/resume/ResumeUpload'
import { FavoriteJobs } from '@/components/jobs/FavoriteJobs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { FileText, Search, User, Trash2, ChevronRight, Home, BarChart, Bell, Star, Upload, Sparkles, Zap, Target, Shield, TrendingUp, Briefcase, CheckCircle, Activity, Clock } from 'lucide-react'
import { ManualSearchForm, ManualSearchParams } from '@/components/search/ManualSearchForm'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resumes, setResumes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedResumes, setSelectedResumes] = useState<Set<string>>(new Set())
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleBulkDelete = async () => {
    if (selectedResumes.size === 0) return
    
    try {
      for (const resumeId of selectedResumes) {
        const resume = resumes.find(r => r.id === resumeId)
        if (resume?.file_path) {
          await supabase.storage
            .from('resumes')
            .remove([resume.file_path])
        }
        
        await supabase
          .from('resumes')
          .update({ is_active: false })
          .eq('id', resumeId)
      }
      
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'search_complete',
        message: `Successfully deleted ${selectedResumes.size} resumes`,
        read: false,
        timestamp: new Date()
      }, ...prev])
      
      if (user) {
        await loadResumes(user.id)
      }
      
      setSelectedResumes(new Set())
      setShowBulkDelete(false)
    } catch (error: any) {
      console.error('Bulk delete error:', error)
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'error',
        message: `Failed to delete resumes: ${error.message}`,
        read: false,
        timestamp: new Date()
      }, ...prev])
    }
  }
  
  const [searchingJobs, setSearchingJobs] = useState<string | null>(null)
  const [deletingResume, setDeletingResume] = useState<string | null>(null)
  const [resumeToDelete, setResumeToDelete] = useState<{id: string, filename: string} | null>(null)
  const [optimizingResume, setOptimizingResume] = useState<string | null>(null)
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

      const resumesWithStats = await Promise.all(
        (resumesData || []).map(async (resume) => {
          const { data: searchData } = await supabase
            .from('job_searches')
            .select('id, total_results, search_date')
            .eq('resume_id', resume.id)
            .order('search_date', { ascending: false })
            .limit(1)
            .maybeSingle() 

          if (searchData) {
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
    
    const resume = resumes.find(r => r.id === resumeId)
    if (resume) {
      setActiveResume(resume)
    }
    
    let progressInterval = setInterval(() => {
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
      
      const searchParams = {
        jobTitle: resume?.extracted_keywords?.currentJobTitle || 'Software Engineer',
        location: 'Massachusetts, USA',
        locationType: 'any',
        keywords: resume?.extracted_keywords?.searchKeywords || [],
        experienceLevel: resume?.extracted_keywords?.experienceLevel || 'mid'
      }
      
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          searchType: 'resume',
          resumeId: resumeId,
          searchParams: searchParams
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
      
      setSearchResults(prev => ({
        ...prev,
        [resumeId]: {
          status: 'success',
          message: `Found ${result.totalJobs} jobs across ${result.jobBoardsSearched || 1} job boards!`,
          totalJobs: result.totalJobs,
          jobBoardsSearched: result.jobBoardsSearched || 1,
          searchId: result.searchId
        }
      }))
      
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

  const handleATSOptimize = async (resumeId: string) => {
    setOptimizingResume(resumeId)
    
    try {
      console.log('Starting ATS optimization for resume:', resumeId)
      
      const response = await fetch('/api/ats-optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resumeId,
          userId: user.id
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('ATS optimization API error:', errorText)
        throw new Error(`ATS optimization failed: ${errorText}`)
      }

      const result = await response.json()
      console.log('ATS optimization completed:', result)
      
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'search_complete',
        message: `Resume optimized! ATS Score: ${result.atsScore}%`,
        read: false,
        timestamp: new Date()
      }, ...prev])
      
      if (user) {
        await loadResumes(user.id)
      }
      
      router.push(`/dashboard/ats-results/${result.optimizedResumeId}`)
      
    } catch (error: any) {
      console.error('ATS optimization error:', error)
      
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'error',
        message: `Optimization failed: ${error.message}`,
        read: false,
        timestamp: new Date()
      }, ...prev])
    } finally {
      setOptimizingResume(null)
    }
  }

  const handleManualSearch = async (searchParams: ManualSearchParams) => {
    setSearchingJobs('manual')
    setSearchProgress(0)
    
    let progressInterval = setInterval(() => {
      setSearchProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 500)
    
    try {
      console.log('Starting manual job search:', searchParams)
      
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          searchType: 'manual',
          searchParams: {
            jobTitle: searchParams.jobTitle,
            location: searchParams.location,
            locationType: searchParams.locationType,
            salaryMin: searchParams.salaryMin,
            salaryMax: searchParams.salaryMax,
            experienceLevel: searchParams.experienceLevel,
            keywords: searchParams.keywords
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Manual search API error response:', errorText)
        throw new Error(`Job search failed (${response.status}): ${errorText.substring(0, 200)}`)
      }

      const result = await response.json()
      console.log('Manual search completed:', result)

      clearInterval(progressInterval)
      setSearchProgress(100)
      
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'search_complete',
        message: `Manual search complete! Found ${result.totalJobs} ${searchParams.jobTitle} jobs in ${searchParams.location}`,
        read: false,
        timestamp: new Date()
      }, ...prev])
      
      router.push(`/dashboard/results/${result.searchId}`)
      
      if (user) {
        await loadTodayStats(user.id)
      }

    } catch (error: any) {
      console.error('Manual search error:', error)
      clearInterval(progressInterval)
      setSearchProgress(0)
      
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'error',
        message: `Search failed: ${error.message}`,
        read: false,
        timestamp: new Date()
      }, ...prev])
    } finally {
      setSearchingJobs(null)
      setTimeout(() => setSearchProgress(0), 1000)
    }
  }

  const handleDeleteResume = async () => {
    if (!resumeToDelete) return
    
    setDeletingResume(resumeToDelete.id)
    
    try {
      const resume = resumes.find(r => r.id === resumeToDelete.id)
      if (resume?.file_path) {
        const { error: storageError } = await supabase.storage
          .from('resumes')
          .remove([resume.file_path])
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError)
        }
      }

      const { error: dbError } = await supabase
        .from('resumes')
        .update({ is_active: false })
        .eq('id', resumeToDelete.id)

      if (dbError) {
        throw dbError
      }

      if (user) {
        await loadResumes(user.id)
      }

      setSearchResults(prev => ({
        ...prev,
        [resumeToDelete.id]: {
          status: 'success',
          message: `Resume "${resumeToDelete.filename}" has been deleted successfully.`
        }
      }))
      
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
        'search': 'Job Search',
        'favorites': 'Favorites'
      }
      breadcrumbs.push({
        name: tabNames[activeTab] || activeTab,
        href: `/dashboard#${activeTab}`,
        icon: activeTab === 'search' ? Search : activeTab === 'favorites' ? Star : FileText
      })
    }
    
    return breadcrumbs
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto"></div>
          </div>
          <p className="mt-4 text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/20 via-cyan-600/20 to-blue-600/20" />
      
      {/* Animated particles */}
      {mounted && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-10"
              style={{
                width: Math.random() * 3 + 'px',
                height: Math.random() * 3 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animation: `float ${Math.random() * 10 + 20}s linear infinite`,
                animationDelay: Math.random() * 20 + 's'
              }}
            />
          ))}
        </div>
      )}
      
      {searchProgress > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out shadow-lg shadow-blue-500/50"
              style={{ width: `${searchProgress}%` }}
            />
          </div>
        </div>
      )}
      
      <header className="relative bg-white shadow-lg">
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
              {activeResume && (
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm border border-blue-200">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium text-gray-900 max-w-[150px] truncate">
                    {activeResume.filename}
                  </span>
                </div>
              )}
              
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    <span className="font-bold text-blue-700">{todayStats.jobsFound}</span>
                    <span className="text-gray-600 ml-1">jobs today</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">
                    <span className="font-bold text-purple-700">{todayStats.searchesRun}</span>
                    <span className="text-gray-600 ml-1">searches</span>
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    if (!showNotifications) markNotificationsAsRead()
                  }}
                  className="relative p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-500/20 z-50">
                    <div className="p-4 border-b border-blue-500/20">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-6 text-sm text-gray-400 text-center">No notifications yet</p>
                      ) : (
                        <div className="divide-y divide-blue-500/10">
                          {notifications.slice(0, 10).map((notification) => (
                            <div key={notification.id} className="p-4 hover:bg-blue-500/10 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 h-2 w-2 rounded-full ${
                                  notification.read ? 'bg-gray-500' : 'bg-gradient-to-r from-blue-400 to-cyan-400'
                                } ${!notification.read && 'animate-pulse'}`} />
                                <div className="flex-1">
                                  <p className="text-sm text-gray-100">{notification.message}</p>
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
              
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full" />
                <span className="text-gray-700 text-sm font-medium">
                  {user.user_metadata?.first_name || user.email?.split('@')[0]}
                </span>
              </div>
              
              <Button 
                onClick={handleLogout} 
                variant="destructive"
                className="bg-red-500 hover:bg-red-600 text-white border-0"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="flex items-center gap-2 text-sm">
          {getBreadcrumbs().map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <ChevronRight className="h-4 w-4 text-blue-400/50" />}
              <Link 
                href={crumb.href} 
                className="flex items-center gap-1 text-blue-300 hover:text-white transition-colors"
              >
                <crumb.icon className="h-3.5 w-3.5" />
                <span>{crumb.name}</span>
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>

      <main className="relative max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 p-1 rounded-2xl grid w-full grid-cols-5">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-xl transition-all"
              >
                <User className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="upload"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-xl transition-all"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger 
                value="resumes"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-xl transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />
                Resumes ({resumes.length})
              </TabsTrigger>
              <TabsTrigger 
                value="search"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-xl transition-all"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger 
                value="favorites"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-xl transition-all"
              >
                <Star className="h-4 w-4 mr-2" />
                Favorites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-slate-800/80 backdrop-blur-sm border-blue-500/20 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setActiveTab('upload')}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/25"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Resume
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('search')}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/25"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Manual Search
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('resumes')}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                      disabled={resumes.length === 0}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Resume Search
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/80 backdrop-blur-sm border-blue-500/20 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-cyan-400" />
                      Your Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-gray-300">Resumes:</span>
                      <span className="font-bold text-white text-lg">{resumes.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-gray-300">AI Parsed:</span>
                      <span className="font-bold text-green-400 text-lg">
                        {resumes.filter(r => r.extracted_keywords).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-gray-300">ATS Optimized:</span>
                      <span className="font-bold text-purple-400 text-lg">
                        {resumes.filter(r => r.is_ats_optimized).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-gray-300">Jobs Found:</span>
                      <span className="font-bold text-cyan-400 text-lg">{todayStats.jobsFound}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/80 backdrop-blur-sm border-blue-500/20 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-400" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {resumes.length === 0 ? (
                      <div className="text-center py-8">
                        <Upload className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">
                          No activity yet. Upload a resume to get started!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {resumes.slice(0, 3).map((resume) => (
                          <div key={resume.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors">
                            <FileText className="h-5 w-5 text-blue-400" />
                            <span className="truncate flex-1 text-gray-200">{resume.filename}</span>
                            <div className="flex gap-1">
                              {resume.extracted_keywords && (
                                <span className="h-2 w-2 bg-green-400 rounded-full" title="AI Parsed" />
                              )}
                              {resume.is_ats_optimized && (
                                <span className="h-2 w-2 bg-purple-400 rounded-full" title="ATS Optimized" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
                  <div className="text-3xl font-bold text-cyan-300">{resumes.length}</div>
                  <div className="text-sm text-gray-300 mt-1">Total Resumes</div>
                </div>
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
                  <div className="text-3xl font-bold text-green-300">{todayStats.jobsFound}</div>
                  <div className="text-sm text-gray-300 mt-1">Jobs Found Today</div>
                </div>
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                  <div className="text-3xl font-bold text-purple-300">{todayStats.searchesRun}</div>
                  <div className="text-sm text-gray-300 mt-1">Searches Today</div>
                </div>
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30">
                  <div className="text-3xl font-bold text-yellow-300">10+</div>
                  <div className="text-sm text-gray-300 mt-1">Job Boards</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upload">
              <ResumeUpload onUploadSuccess={handleUploadSuccess} />
            </TabsContent>

            <TabsContent value="resumes" className="space-y-6">
              <Card className="bg-slate-800/80 backdrop-blur-sm border-blue-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      My Resumes
                    </CardTitle>
                    {resumes.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                          onClick={() => {
                            if (selectedResumes.size === resumes.length) {
                              setSelectedResumes(new Set())
                            } else {
                              setSelectedResumes(new Set(resumes.map(r => r.id)))
                            }
                          }}
                        >
                          {selectedResumes.size === resumes.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        {selectedResumes.size > 0 && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                            onClick={() => setShowBulkDelete(true)}
                          >
                            Delete Selected ({selectedResumes.size})
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {resumes.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                        <FileText className="relative h-16 w-16 text-gray-500 mx-auto mb-4" />
                      </div>
                      <h3 className="text-xl font-medium text-white mb-2">No resumes uploaded</h3>
                      <p className="text-gray-400 mb-6">Upload your first resume to unlock AI-powered job searching</p>
                      <Button 
                        onClick={() => setActiveTab('upload')}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Resume
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resumes.map((resume) => (
                        <div key={resume.id} className="group relative bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/10">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <input
                                type="checkbox"
                                checked={selectedResumes.has(resume.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedResumes)
                                  if (e.target.checked) {
                                    newSelected.add(resume.id)
                                  } else {
                                    newSelected.delete(resume.id)
                                  }
                                  setSelectedResumes(newSelected)
                                }}
                                className="h-5 w-5 rounded bg-slate-700 border-blue-500/50 text-blue-500 focus:ring-blue-500/50 mt-1"
                              />
                              <div className="relative">
                                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
                                <FileText className="relative h-10 w-10 text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-white text-lg">{resume.filename}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                  <span>Uploaded {new Date(resume.upload_date).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{Math.round(resume.file_size / 1024)} KB</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {resume.is_ats_optimized && (
                                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 px-3 py-1 rounded-full text-xs border border-purple-500/30">
                                      <Star className="h-3 w-3" />
                                      ATS Optimized
                                    </span>
                                  )}
                                  {resume.extracted_keywords && (
                                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 px-3 py-1 rounded-full text-xs border border-green-500/30">
                                      <CheckCircle className="h-3 w-3" />
                                      AI Parsed
                                    </span>
                                  )}
                                </div>
                                
                                {searchResults[resume.id] && (
                                  <div className={`mt-4 p-4 rounded-lg ${
                                    searchResults[resume.id].status === 'success' 
                                      ? 'bg-green-500/20 border border-green-500/30' 
                                      : 'bg-red-500/20 border border-red-500/30'
                                  }`}>
                                    <p className={`text-sm font-medium ${
                                      searchResults[resume.id].status === 'success'
                                        ? 'text-green-300'
                                        : 'text-red-300'
                                    }`}>
                                      {searchResults[resume.id].status === 'success' ? '✅' : '❌'} {searchResults[resume.id].message}
                                    </p>
                                    {searchResults[resume.id].status === 'success' && searchResults[resume.id].searchId && (
                                      <Button
                                        size="sm"
                                        variant="link"
                                        className="mt-2 p-0 h-auto text-green-400 hover:text-green-300"
                                        onClick={() => router.push(`/dashboard/results/${searchResults[resume.id].searchId}`)}
                                      >
                                        View job results →
                                      </Button>
                                    )}
                                  </div>
                                )}
                                
                                {resume.total_jobs_found > 0 && !searchResults[resume.id] && (
                                  <div className="mt-4 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                                    <p className="text-sm font-medium text-blue-300">
                                      📊 Last Search Results
                                    </p>
                                    <p className="text-sm text-blue-100 mt-1">
                                      Found {resume.total_jobs_found} jobs across {resume.job_boards_searched} job boards
                                    </p>
                                    {resume.last_search_date && (
                                      <p className="text-sm text-blue-200/70 mt-1">
                                        {new Date(resume.last_search_date).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {resume.extracted_keywords && (
                                  <div className="mt-4 space-y-2">
                                    {resume.extracted_keywords.currentJobTitle && (
                                      <p className="text-sm text-gray-300">
                                        <span className="text-gray-500">Role:</span> {resume.extracted_keywords.currentJobTitle}
                                      </p>
                                    )}
                                    {resume.extracted_keywords.searchKeywords && (
                                      <p className="text-sm text-gray-300">
                                        <span className="text-gray-500">Skills:</span> {resume.extracted_keywords.searchKeywords.slice(0, 5).join(', ')}
                                        {resume.extracted_keywords.searchKeywords.length > 5 && ` +${resume.extracted_keywords.searchKeywords.length - 5} more`}
                                      </p>
                                    )}
                                    {resume.extracted_keywords.experienceLevel && (
                                      <p className="text-sm text-gray-300">
                                        <span className="text-gray-500">Level:</span> {resume.extracted_keywords.experienceLevel}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {resume.total_jobs_found > 0 && resume.last_search_id && (
                                <Button 
                                  size="sm" 
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25"
                                  onClick={() => router.push(`/dashboard/results/${resume.last_search_id}`)}
                                >
                                  <BarChart className="h-4 w-4 mr-1" />
                                  View Results
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                                onClick={() => handleJobSearch(resume.id)}
                                disabled={!resume.extracted_keywords || searchingJobs === resume.id}
                              >
                                {searchingJobs === resume.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    Searching...
                                  </>
                                ) : (
                                  <>
                                    <Search className="h-4 w-4 mr-1" />
                                    {resume.total_jobs_found > 0 ? 'Search Again' : 'Search Jobs'}
                                  </>
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant={resume.is_ats_optimized ? "default" : "secondary"}
                                className={resume.is_ats_optimized ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                                onClick={() => {
                                  if (resume.is_ats_optimized) {
                                    router.push(`/dashboard/ats-results/${resume.id}`)
                                  } else {
                                    handleATSOptimize(resume.id)
                                  }
                                }}
                                disabled={!resume.extracted_keywords || optimizingResume === resume.id}
                              >
                                {optimizingResume === resume.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Optimizing...
                                  </>
                                ) : resume.is_ats_optimized ? (
                                  <>
                                    <svg className="w-4 h-4 mr-1.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    ATS Optimized
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4 mr-1" />
                                    ATS Optimize
                                  </>
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                                onClick={() => setResumeToDelete({id: resume.id, filename: resume.filename})}
                                disabled={deletingResume === resume.id}
                              >
                                {deletingResume === resume.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-300 border-t-transparent"></div>
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
              <Card className="bg-slate-800/80 backdrop-blur-sm border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="h-5 w-5 text-cyan-400" />
                    Manual Job Search
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Search for jobs across all major job boards without uploading a resume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ManualSearchForm 
                    onSearch={handleManualSearch}
                    isSearching={searchingJobs === 'manual'}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card className="bg-slate-800/80 backdrop-blur-sm border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    My Favorite Jobs
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Jobs you've starred across all your searches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FavoriteJobs userId={user.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AlertDialog open={!!resumeToDelete} onOpenChange={() => setResumeToDelete(null)}>
        <AlertDialogContent className="bg-slate-800 border-red-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Resume</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete "{resumeToDelete?.filename}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteResume}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}

      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent className="bg-slate-800 border-red-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete {selectedResumes.size} Resumes</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete {selectedResumes.size} selected resumes? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
            >
              Delete All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-100vh); }
        }
      `}</style>
    </div>
  )
}