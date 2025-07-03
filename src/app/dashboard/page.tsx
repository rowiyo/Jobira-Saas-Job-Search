'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

import dynamic from 'next/dynamic'
const ResumeUpload = dynamic(() => import('@/components/resume/ResumeUpload').then(mod => mod.ResumeUpload), {
  ssr: false
})
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { FileText, Search, User, Trash2, ChevronRight, Home, BarChart, Bell, Star, Upload, Sparkles, Zap, Target, Shield, TrendingUp, Briefcase, CheckCircle, Activity, Clock, PenTool, ChevronDown, Settings, LogOut, ArrowRight, Layers, Gauge } from 'lucide-react'
import { ManualSearchForm, ManualSearchParams } from '@/components/search/ManualSearchForm'

export default function Dashboard() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resumes, setResumes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedResumes, setSelectedResumes] = useState<Set<string>>(new Set())
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  
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
      
      // Load user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setProfile(profileData)
      
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

    if (!user) {
    console.error('No user found when trying to search')
    setNotifications(prev => [{
      id: Date.now().toString(),
      type: 'error',
      message: 'You must be logged in to search',
      read: false,
      timestamp: new Date()
    }, ...prev])
    return
  }

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
        'templates': 'Templates',
        'coverletters': 'Cover Letters',
        'favorites': 'Favorites'
      }
      breadcrumbs.push({
        name: tabNames[activeTab] || activeTab,
        href: `/dashboard#${activeTab}`,
        icon: activeTab === 'search' ? Search : 
              activeTab === 'favorites' ? Star : 
              activeTab === 'coverletters' ? PenTool :
              FileText
      })
    }
    
    return breadcrumbs
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {searchProgress > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-gray-100">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${searchProgress}%` }}
            />
          </div>
        </div>
      )}
      
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <img 
                src="/jobira_logo_sm.png" 
                alt="Jobira" 
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center space-x-6">
              {activeResume && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium text-gray-900 max-w-[150px] truncate">
                    {activeResume.filename}
                  </span>
                </div>
              )}
              
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-gray-900">{todayStats.jobsFound}</div>
                  <span className="text-sm text-gray-600">jobs today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-gray-900">{todayStats.searchesRun}</div>
                  <span className="text-sm text-gray-600">searches</span>
                </div>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    if (!showNotifications) markNotificationsAsRead()
                  }}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-600 rounded-full animate-pulse"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-6 text-sm text-gray-500 text-center">No notifications yet</p>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.slice(0, 10).map((notification) => (
                            <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 h-2 w-2 rounded-full ${
                                  notification.read ? 'bg-gray-300' : 'bg-blue-600 animate-pulse'
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <span className="text-gray-900 text-sm font-medium">
                      {user.user_metadata?.first_name || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white">
                  <DropdownMenuItem 
                    onClick={() => router.push('/dashboard/account')}
                    className="cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
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
        <div className="px-4 sm:px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-gray-50 border border-gray-200 p-1 rounded-lg grid w-full grid-cols-7">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
              >
                <Gauge className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              
              <TabsTrigger 
                value="upload"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              
              <TabsTrigger 
                value="resumes"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all relative"
              >
                <FileText className="h-4 w-4 mr-2" />
                My Resumes
                {resumes.length > 0 && (
                  <span className="ml-2 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded-full">{resumes.length}</span>
                )}
              </TabsTrigger>
              
              <TabsTrigger 
                value="search"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </TabsTrigger>
              
              <TabsTrigger 
                value="templates"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
              >
                <Layers className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
              
              <TabsTrigger 
                value="coverletters"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Cover Letters
              </TabsTrigger>
              
              <TabsTrigger 
                value="favorites"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
              >
                <Star className="h-4 w-4 mr-2" />
                Favorites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Hero Section */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
                <div className="relative z-10">
                  <h1 className="text-3xl font-bold mb-2">Welcome back, {user.user_metadata?.first_name || 'there'}!</h1>
                  <p className="text-blue-100 mb-6">Your AI-powered job search assistant is ready to help you find your dream job.</p>
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => setActiveTab('upload')}
                      className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 py-2.5"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Resume
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('search')}
                      className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/30 font-semibold px-6 py-2.5"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Quick Search
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-500">Total</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{resumes.length}</div>
                    <p className="text-sm text-gray-600 mt-1">Active Resumes</p>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-500">Today</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{todayStats.jobsFound}</div>
                    <p className="text-sm text-gray-600 mt-1">Jobs Found</p>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Activity className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-500">Today</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{todayStats.searchesRun}</div>
                    <p className="text-sm text-gray-600 mt-1">Searches Run</p>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Layers className="h-6 w-6 text-orange-600" />
                      </div>
                      <span className="text-sm text-gray-500">Active</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">10+</div>
                    <p className="text-sm text-gray-600 mt-1">Job Boards</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setActiveTab('upload')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
                    >
                      <Upload className="h-4 w-4 mr-3" />
                      Upload New Resume
                    </Button>
                    
                    <Button 
                      onClick={() => setActiveTab('search')}
                      variant="outline"
                      className="w-full border-gray-300 hover:bg-gray-50 justify-start"
                    >
                      <Search className="h-4 w-4 mr-3" />
                      Manual Job Search
                    </Button>
                    
                    <Button 
                      onClick={() => router.push('/dashboard/resume-builder')}
                      variant="outline"
                      className="w-full border-gray-300 hover:bg-gray-50 justify-start"
                    >
                      <Layers className="h-4 w-4 mr-3" />
                      Browse Templates
                    </Button>
                    
                    <Button 
                      onClick={() => setActiveTab('coverletters')}
                      variant="outline"
                      className="w-full border-gray-300 hover:bg-gray-50 justify-start"
                    >
                      <PenTool className="h-4 w-4 mr-3" />
                      Create Cover Letter
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Resumes */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Recent Resumes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {resumes.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">
                          No resumes uploaded yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {resumes.slice(0, 4).map((resume) => (
                          <div key={resume.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setActiveTab('resumes')}>
                            <div className="p-2 bg-gray-100 rounded">
                              <FileText className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{resume.filename}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(resume.upload_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {resume.extracted_keywords && (
                                <div className="h-2 w-2 bg-green-500 rounded-full" title="AI Parsed" />
                              )}
                              {resume.is_ats_optimized && (
                                <div className="h-2 w-2 bg-blue-600 rounded-full" title="ATS Optimized" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-blue-600" />
                      Your Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">AI Parsed</span>
                        <span className="font-medium text-gray-900">
                          {resumes.filter(r => r.extracted_keywords).length}/{resumes.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${resumes.length ? (resumes.filter(r => r.extracted_keywords).length / resumes.length * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">ATS Optimized</span>
                        <span className="font-medium text-gray-900">
                          {resumes.filter(r => r.is_ats_optimized).length}/{resumes.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${resumes.length ? (resumes.filter(r => r.is_ats_optimized).length / resumes.length * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Searched</span>
                        <span className="font-medium text-gray-900">
                          {resumes.filter(r => r.total_jobs_found > 0).length}/{resumes.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${resumes.length ? (resumes.filter(r => r.total_jobs_found > 0).length / resumes.length * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="upload">
              <ResumeUpload onUploadSuccess={handleUploadSuccess} />
            </TabsContent>

            <TabsContent value="resumes" className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900">My Resumes</CardTitle>
                      <CardDescription className="text-gray-600 mt-1">
                        Manage your resumes and run AI-powered job searches
                      </CardDescription>
                    </div>
                    {resumes.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                            variant="destructive"
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
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No resumes uploaded</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Upload your first resume to unlock AI-powered job searching across 10+ job boards
                      </p>
                      <Button 
                        onClick={() => setActiveTab('upload')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Your First Resume
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resumes.map((resume) => (
                        <div key={resume.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-200">
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
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                              />
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <FileText className="h-6 w-6 text-gray-700" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg">{resume.filename}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                  <span>Uploaded {new Date(resume.upload_date).toLocaleDateString()}</span>
                                  <span className="text-gray-400">•</span>
                                  <span>{Math.round(resume.file_size / 1024)} KB</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {resume.is_ats_optimized && (
                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                      <CheckCircle className="h-3 w-3" />
                                      ATS Optimized
                                    </span>
                                  )}
                                  {resume.extracted_keywords && (
                                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                      <Sparkles className="h-3 w-3" />
                                      AI Parsed
                                    </span>
                                  )}
                                  {resume.total_jobs_found > 0 && (
                                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                                      <Briefcase className="h-3 w-3" />
                                      {resume.total_jobs_found} Jobs Found
                                    </span>
                                  )}
                                </div>
                                
                                {searchResults[resume.id] && (
                                  <div className={`mt-4 p-4 rounded-lg ${
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
                                
                                {resume.extracted_keywords && (
                                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      {resume.extracted_keywords.currentJobTitle && (
                                        <div>
                                          <span className="text-gray-500">Role:</span>
                                          <span className="ml-2 text-gray-900 font-medium">{resume.extracted_keywords.currentJobTitle}</span>
                                        </div>
                                      )}
                                      {resume.extracted_keywords.experienceLevel && (
                                        <div>
                                          <span className="text-gray-500">Level:</span>
                                          <span className="ml-2 text-gray-900 font-medium">{resume.extracted_keywords.experienceLevel}</span>
                                        </div>
                                      )}
                                    </div>
                                    {resume.extracted_keywords.searchKeywords && (
                                      <div className="mt-3">
                                        <span className="text-gray-500 text-sm">Key Skills:</span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {resume.extracted_keywords.searchKeywords.slice(0, 6).map((skill: string, index: number) => (
                                            <span key={index} className="px-2 py-1 bg-white rounded-md text-xs text-gray-700 border border-gray-200">
                                              {skill}
                                            </span>
                                          ))}
                                          {resume.extracted_keywords.searchKeywords.length > 6 && (
                                            <span className="px-2 py-1 text-xs text-gray-500">
                                              +{resume.extracted_keywords.searchKeywords.length - 6} more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {resume.total_jobs_found > 0 && resume.last_search_id && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-gray-300"
                                  onClick={() => router.push(`/dashboard/results/${resume.last_search_id}`)}
                                >
                                  <BarChart className="h-4 w-4 mr-1" />
                                  View Results
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700 text-white"
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
                              {resume.is_ats_optimized ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      disabled={optimizingResume === resume.id}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      ATS Optimized
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 bg-white">
                                    <DropdownMenuItem 
                                      onClick={() => router.push(`/dashboard/ats-results/${resume.id}`)}
                                      className="cursor-pointer"
                                    >
                                      <BarChart className="h-4 w-4 mr-2" />
                                      View ATS Score
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleATSOptimize(resume.id)}
                                      className="cursor-pointer"
                                    >
                                      <Shield className="h-4 w-4 mr-2" />
                                      Re-optimize Resume
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-gray-300"
                                  onClick={() => handleATSOptimize(resume.id)}
                                  disabled={!resume.extracted_keywords || optimizingResume === resume.id}
                                >
                                  {optimizingResume === resume.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
                                      Optimizing...
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="h-4 w-4 mr-1" />
                                      ATS Optimize
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => setResumeToDelete({id: resume.id, filename: resume.filename})}
                                disabled={deletingResume === resume.id}
                              >
                                {deletingResume === resume.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
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
              <div className="space-y-6">
                {/* Search Hero */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Search className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold">AI-Powered Job Search</h2>
                  </div>
                  <p className="text-blue-100">Search across 10+ job boards instantly. Find your perfect role in seconds.</p>
                </div>

                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Search for Jobs</CardTitle>
                    <CardDescription className="text-gray-600">
                      Enter your criteria and we'll search all major job boards for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading...</p>
                      </div>
                    ) : user ? (
                      <ManualSearchForm 
                        onSearch={handleManualSearch}
                        isSearching={searchingJobs === 'manual'}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-red-600">Please log in to use job search</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Search Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Layers className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">10+ Job Boards</h3>
                    <p className="text-sm text-gray-600">Search Indeed, LinkedIn, Glassdoor, and more</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Zap className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Real-Time Results</h3>
                    <p className="text-sm text-gray-600">Get the latest job postings instantly</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Smart Filtering</h3>
                    <p className="text-sm text-gray-600">Find jobs that match your exact criteria</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates">
              {activeTab === 'templates' && router.push('/dashboard/resume-builder')}
            </TabsContent>

            <TabsContent value="coverletters">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">My Cover Letters</CardTitle>
                  <CardDescription className="text-gray-600">
                    Create AI-powered cover letters tailored to specific job applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PenTool className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No cover letters yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Create personalized cover letters that match your resume and target job
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button 
                        onClick={() => router.push('/dashboard/cover-letters/new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Create New Cover Letter
                      </Button>
                      <Button 
                        onClick={() => router.push('/dashboard/cover-letters')}
                        variant="outline"
                        className="border-gray-300"
                      >
                        View All Cover Letters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">My Favorite Jobs</CardTitle>
                  <CardDescription className="text-gray-600">
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

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transform Your Resume with AI-Powered Templates
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              Choose from professional templates, get instant ATS scoring, and receive personalized suggestions. 
              Convert your existing resume into a job-winning masterpiece in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => router.push('/dashboard/resume-builder')}
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold shadow-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Building Your Resume
              </Button>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="h-5 w-5" />
                <span>25+ Professional Templates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!resumeToDelete} onOpenChange={() => setResumeToDelete(null)}>
        <AlertDialogContent className="bg-white">
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
              className="bg-red-600 hover:bg-red-700 text-white"
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
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedResumes.size} Resumes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedResumes.size} selected resumes? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}