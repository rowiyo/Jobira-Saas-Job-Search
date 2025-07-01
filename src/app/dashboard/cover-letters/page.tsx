'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Search, FileText, Calendar, Building2, Home, BarChart, PenTool } from 'lucide-react'
import { format } from 'date-fns'

interface CoverLetter {
  id: string
  user_id: string
  company_name: string
  job_title: string
  content: string
  job_description?: string
  resume_id?: string
  status: 'draft' | 'completed'
  created_at: string
  updated_at: string
}

export default function CoverLettersPage() {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'completed'>('all')
  const router = useRouter()
  const supabase = createClient()

  // Define breadcrumbs for this page
  const breadcrumbs = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart },
    { name: 'Cover Letters', href: '/dashboard/cover-letters', icon: PenTool }
  ]

  useEffect(() => {
    fetchCoverLetters()
  }, [])

  const fetchCoverLetters = async () => {
    try {
      const { data, error } = await supabase
        .from('cover_letters')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCoverLetters(data || [])
    } catch (error) {
      console.error('Error fetching cover letters:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCoverLetters = coverLetters.filter(letter => {
    const matchesSearch = 
      letter.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || letter.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cover letter?')) return

    try {
      const { error } = await supabase
        .from('cover_letters')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setCoverLetters(prev => prev.filter(letter => letter.id !== id))
    } catch (error) {
      console.error('Error deleting cover letter:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Cover Letters</h1>
            <p className="text-muted-foreground mt-1">
              Manage your cover letters and create new ones
            </p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard/cover-letters/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Cover Letter
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by company or job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cover Letters Grid */}
        {filteredCoverLetters.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cover letters found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your search or filters"
                  : "Create your first cover letter to get started"}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => router.push('/dashboard/cover-letters/')}>
                  Create Cover Letter
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCoverLetters.map((letter) => (
              <Card 
                key={letter.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/dashboard/cover-letters/${letter.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {letter.company_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {letter.job_title}
                      </p>
                    </div>
                    <Badge 
                      variant={letter.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {letter.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(letter.created_at), 'MMM d, yyyy')}
                  </div>
                  {letter.content && (
                    <p className="text-sm mt-3 line-clamp-3">
                      {letter.content.substring(0, 150)}...
                    </p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/cover-letters/${letter.id}/edit`)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(letter.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}