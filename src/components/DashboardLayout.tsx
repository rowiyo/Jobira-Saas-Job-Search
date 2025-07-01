'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Bell, 
  TrendingUp, 
  Activity, 
  ChevronRight, 
  Home,
  BarChart,
  FileText,
  PenTool,
  Search,
  Star
} from 'lucide-react'

interface BreadcrumbItem {
  name: string
  href: string
  icon: any
}

interface DashboardLayoutProps {
  children: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  activeTab?: string
}

export function DashboardLayout({ children, breadcrumbs, activeTab }: DashboardLayoutProps) {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeResume, setActiveResume] = useState<any>(null)
  const [todayStats, setTodayStats] = useState<{jobsFound: number, searchesRun: number}>({jobsFound: 0, searchesRun: 0})
  const [notifications, setNotifications] = useState<Array<{
    id: string,
    type: 'search_complete' | 'new_matches' | 'error',
    message: string,
    read: boolean,
    timestamp: Date
  }>>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth')
        return
      }
      
      setUser(session.user)
      await loadActiveResume(session.user.id)
      await loadTodayStats(session.user.id)
      setLoading(false)
    }

    getUser()
  }, [router])

  const loadActiveResume = async (userId: string) => {
    try {
      const { data: resumesData } = await supabase
        .from('resumes')
        .select('id, filename')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('upload_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (resumesData) {
        setActiveResume(resumesData)
      }
    } catch (error) {
      console.error('Failed to load active resume:', error)
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Default breadcrumbs if not provided
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart }
  ]

  const finalBreadcrumbs = breadcrumbs || defaultBreadcrumbs

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
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
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg text-sm">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium text-gray-900 max-w-[150px] truncate">
                    {activeResume.filename}
                  </span>
                </div>
              )}
              
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    <span className="font-bold text-gray-900">{todayStats.jobsFound}</span>
                    <span className="text-gray-600 ml-1">jobs today</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    <span className="font-bold text-gray-900">{todayStats.searchesRun}</span>
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
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-blue-50 rounded-lg transition-all"
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
                            <div key={notification.id} className="p-4 hover:bg-blue-50 transition-colors">
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
              
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700 text-sm font-medium">
                  {user.user_metadata?.first_name || user.email?.split('@')[0]}
                </span>
              </div>
              
              <Button 
                onClick={handleLogout} 
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm">
          {finalBreadcrumbs.map((crumb, index) => (
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
          {children}
        </div>
      </main>

      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
}