'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ExternalLink, MapPin, Building2, Calendar, DollarSign, Search } from 'lucide-react'

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

  const [loading, setLoading] = useState(true)
  const [searchInfo, setSearchInfo] = useState<SearchInfo | null>(null)
  const [jobResults, setJobResults] = useState<JobResult[]>([])
  const [filteredResults, setFilteredResults] = useState<JobResult[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBoard, setSelectedBoard] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')

  useEffect(() => {
    loadJobResults()
  }, [searchId])

  useEffect(() => {
    filterAndSortResults()
  }, [jobResults, searchTerm, selectedBoard, sortBy])

  const loadJobResults = async () => {
    try {
      // First, verify the user has access to this search
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      // Load search info
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

      // Load job results
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

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply job board filter
    if (selectedBoard !== 'all') {
      filtered = filtered.filter(job => job.job_board === selectedBoard)
    }

    // Apply sorting
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

  const selectedJob = jobResults.find(job => job.id === selectedJobId)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Loading job results...</p>
        </div>
      </div>
    )
  }

  if (!searchInfo) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Job Search Results</h1>
                <p className="text-sm text-gray-600">
                  {searchInfo.job_title} in {searchInfo.location} • {searchInfo.total_results} results • 
                  Searched on {new Date(searchInfo.search_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[180px]">
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
            <h2 className="text-lg font-semibold">
              {filteredResults.length} Jobs Found
            </h2>
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredResults.map((job) => (
                <Card 
                  key={job.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedJobId === job.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{job.job_title}</h3>
                      <Badge variant="secondary">{job.job_board}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{job.company_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      {job.salary_range && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{job.salary_range}</span>
                        </div>
                      )}
                      {job.posted_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(job.posted_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {job.relevance_score > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Match Score:</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${job.relevance_score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{Math.round(job.relevance_score * 100)}%</span>
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
              <Card className="h-[calc(100vh-300px)] overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{selectedJob.job_title}</CardTitle>
                      <p className="text-gray-600">{selectedJob.company_name}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => window.open(selectedJob.job_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on {selectedJob.job_board}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="overflow-y-auto h-full pb-20">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <p className="font-medium">{selectedJob.location}</p>
                      </div>
                      {selectedJob.salary_range && (
                        <div>
                          <span className="text-gray-500">Salary:</span>
                          <p className="font-medium">{selectedJob.salary_range}</p>
                        </div>
                      )}
                      {selectedJob.posted_date && (
                        <div>
                          <span className="text-gray-500">Posted:</span>
                          <p className="font-medium">{new Date(selectedJob.posted_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Source:</span>
                        <p className="font-medium">{selectedJob.job_board}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Job Description</h4>
                      <div 
                        className="prose prose-sm max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ 
                          __html: selectedJob.job_description.replace(/\n/g, '<br/>') 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[400px] flex items-center justify-center">
                <p className="text-gray-500">Select a job to view details</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}