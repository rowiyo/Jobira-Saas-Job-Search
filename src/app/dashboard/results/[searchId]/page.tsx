'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, ExternalLink, MapPin, Building2, Calendar, DollarSign, 
  Search, Star, Home, BarChart, FileText, ChevronRight, Bell, 
  User, ChevronDown, Settings, LogOut 
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface JobResult {
  id: string
  job_board: string
  job_title: string
  company_name: string
  location: string
  job_url: string
  job_description: string
  salary_range: string | null
  posted_date: string | null
  relevance_score: number
}

interface SearchInfo {
  id: string
  job_title: string
  location: string
  search_date: string
  total_results: number
  resume?: {
    filename: string
  }
}

export default function JobResultsPage() {
  const params = useParams()
  const router = useRouter()
  const searchId = params.searchId as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [searchInfo, setSearchInfo] = useState<SearchInfo | null>(null)
  const [jobResults, setJobResults] = useState<JobResult[]>([])
  const [filteredResults, setFilteredResults] = useState<JobResult[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBoard, setSelectedBoard] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')

  useEffect(() => {
    loadUserAndProfile()
    loadJobResults()
    loadFavorites()
  }, [searchId])

  const loadUserAndProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(profileData)
    }
  }

  const loadFavorites = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('job_favorites')
      .select('job_search_result_id')
      .eq('user_id', session.user.id)

    if (data) {
      setFavorites(new Set(data.map(f => f.job_search_result_id)))
    }
  }

  const toggleFavorite = async (jobId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    setFavoriteLoading(jobId)
    
    try {
      if (favorites.has(jobId)) {
        await supabase
          .from('job_favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('job_search_result_id', jobId)
        
        setFavorites(prev => {
          const newFavorites = new Set(prev)
          newFavorites.delete(jobId)
          return newFavorites
        })
      } else {
        await supabase
          .from('job_favorites')
          .insert({
            user_id: session.user.id,
            job_search_result_id: jobId
          })
        
        setFavorites(prev => new Set(prev).add(jobId))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setFavoriteLoading(null)
    }
  }

  useEffect(() => {
    filterAndSortResults()
  }, [jobResults, searchTerm, selectedBoard, sortBy])

  const loadJobResults = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      const { data: searchData, error: searchError } = await supabase
        .from('job_searches')
        .select(`
          id,
          job_title,
          location,
          search_date,
          total_results,
          resumes (
            filename
          )
        `)
        .eq('id', searchId)
        .eq('user_id', session.user.id)
        .single()

      if (searchError || !searchData) {
        console.error('Error loading search:', searchError)
        router.push('/dashboard')
        return
      }

      setSearchInfo({
        ...searchData,
        resume: searchData.resumes
      })

      const { data: resultsData, error: resultsError } = await supabase
        .from('job_search_results')
        .select('*')
        .eq('search_id', searchId)
        .order('relevance_score', { ascending: false })

      if (resultsError) {
        console.error('Error loading results:', resultsError)
      } else {
        setJobResults(resultsData || [])
        if (resultsData && resultsData.length > 0) {
          setSelectedJobId(resultsData[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load job results:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortResults = () => {
    let filtered = [...jobResults]

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedBoard !== 'all') {
      filtered = filtered.filter(job => job.job_board === selectedBoard)
    }

    switch (sortBy) {
      case 'relevance':
        filtered.sort((a, b) => b.relevance_score - a.relevance_score)
        break
      case 'date':
        filtered.sort((a, b) => {
          if (!a.posted_date) return 1
          if (!b.posted_date) return -1
          return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
        })
        break
      case 'company':
        filtered.sort((a, b) => a.company_name.localeCompare(b.company_name))
        break
    }

    setFilteredResults(filtered)
  }

  const getJobBoards = () => {
    const boards = new Set(jobResults.map(job => job.job_board))
    return Array.from(boards)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const selectedJob = jobResults.find(job => job.id === selectedJobId)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading job results...</p>
        </div>
      </div>
    )
  }

  if (!searchInfo) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - matching Dashboard style */}
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
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-gray-900">{searchInfo.total_results}</div>
                  <span className="text-sm text-gray-600">jobs found</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-gray-900">{getJobBoards().length}</div>
                  <span className="text-sm text-gray-600">job boards</span>
                </div>
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
                      {user?.user_metadata?.first_name || user?.email?.split('@')[0]}
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

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Link href="/dashboard" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
            <BarChart className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="flex items-center gap-1 text-gray-900">
            <Search className="h-3.5 w-3.5" />
            <span>Search Results</span>
          </span>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Search Info Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Search Results</h1>
            <p className="text-gray-600">
              <span className="font-medium">{searchInfo.job_title}</span> in <span className="font-medium">{searchInfo.location}</span>
              {searchInfo.resume && (
                <span> • Resume: <span className="font-medium">{searchInfo.resume.filename}</span></span>
              )}
              <span className="text-gray-500"> • Searched {new Date(searchInfo.search_date).toLocaleDateString()}</span>
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-gray-200">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 border-gray-300"
                    />
                  </div>
                </div>
                <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                  <SelectTrigger className="w-[180px] border-gray-300">
                    <SelectValue placeholder="All Job Boards" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Job Boards</SelectItem>
                    {getJobBoards().map(board => (
                      <SelectItem key={board} value={board}>{board}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] border-gray-300">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Date Posted</SelectItem>
                    <SelectItem value="company">Company Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {filteredResults.length} Jobs Found
                </h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="border-gray-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredResults.map((job) => (
                  <Card 
                    key={job.id}
                    className={`cursor-pointer transition-all border-gray-200 hover:border-gray-300 hover:shadow-lg ${
                      selectedJobId === job.id ? 'ring-2 ring-blue-600 border-blue-600' : ''
                    }`}
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{job.job_title}</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(job.id)
                            }}
                            disabled={favoriteLoading === job.id}
                            className="h-8 w-8 p-0"
                          >
                            {favoriteLoading === job.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                            ) : (
                              <Star 
                                className={`h-4 w-4 ${favorites.has(job.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} 
                              />
                            )}
                          </Button>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">{job.job_board}</Badge>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{job.company_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{job.location}</span>
                        </div>
                        {job.salary_range && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span>{job.salary_range}</span>
                          </div>
                        )}
                        {job.posted_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{new Date(job.posted_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      {job.relevance_score > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Match Score:</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${job.relevance_score * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-900">{Math.round(job.relevance_score * 100)}%</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Job Details */}
            <div className="lg:sticky lg:top-6">
              {selectedJob ? (
                <Card className="h-[calc(100vh-300px)] overflow-hidden border-gray-200">
                  <CardHeader className="pb-3 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-gray-900">{selectedJob.job_title}</CardTitle>
                        <p className="text-gray-600 mt-1">{selectedJob.company_name}</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.open(selectedJob.job_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on {selectedJob.job_board}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-y-auto h-full pb-20 p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <p className="font-medium text-gray-900 mt-1">{selectedJob.location}</p>
                        </div>
                        {selectedJob.salary_range && (
                          <div>
                            <span className="text-gray-500">Salary:</span>
                            <p className="font-medium text-gray-900 mt-1">{selectedJob.salary_range}</p>
                          </div>
                        )}
                        {selectedJob.posted_date && (
                          <div>
                            <span className="text-gray-500">Posted:</span>
                            <p className="font-medium text-gray-900 mt-1">{new Date(selectedJob.posted_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Source:</span>
                          <p className="font-medium text-gray-900 mt-1">{selectedJob.job_board}</p>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Job Description</h4>
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: selectedJob.job_description.replace(/\n/g, '<br/>') 
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-[400px] flex items-center justify-center border-gray-200">
                  <p className="text-gray-500">Select a job to view details</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}