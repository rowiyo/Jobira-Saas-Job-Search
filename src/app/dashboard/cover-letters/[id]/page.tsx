'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Edit, Download, Trash2, Building2, Briefcase, Calendar, FileText, Home, BarChart, PenTool, Eye, List } from 'lucide-react'
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
  title?: string
}

export default function CoverLetterDetailPage() {
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const id = params.id as string

  // Define breadcrumbs - will update when cover letter loads
  const [breadcrumbs, setBreadcrumbs] = useState([
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart },
    { name: 'Cover Letters', href: '/dashboard/cover-letters', icon: PenTool },
    { name: 'View', href: `/dashboard/cover-letters/${id}`, icon: Eye }
  ])

  useEffect(() => {
    if (id) {
      fetchCoverLetter()
    }
  }, [id])

  useEffect(() => {
    // Update breadcrumbs when cover letter loads
    if (coverLetter) {
      setBreadcrumbs([
        { name: 'Home', href: '/', icon: Home },
        { name: 'Dashboard', href: '/dashboard', icon: BarChart },
        { name: 'Cover Letters', href: '/dashboard/cover-letters', icon: PenTool },
        { name: coverLetter.title || `${coverLetter.job_title} at ${coverLetter.company_name}`, href: `/dashboard/cover-letters/${id}`, icon: Eye }
      ])
    }
  }, [coverLetter, id])

  const fetchCoverLetter = async () => {
    try {
      const { data, error } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setCoverLetter(data)
    } catch (error) {
      console.error('Error fetching cover letter:', error)
      router.push('/dashboard/cover-letters')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this cover letter?')) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('cover_letters')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      router.push('/dashboard/cover-letters')
    } catch (error) {
      console.error('Error deleting cover letter:', error)
      setDeleting(false)
    }
  }

  const handleDownload = () => {
    if (!coverLetter) return

    const content = `Cover Letter for ${coverLetter.job_title} at ${coverLetter.company_name}
Created: ${format(new Date(coverLetter.created_at), 'MMMM d, yyyy')}

${coverLetter.content}`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cover-letter-${coverLetter.company_name.toLowerCase().replace(/\s+/g, '-')}-${coverLetter.job_title.toLowerCase().replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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

  if (!coverLetter) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Cover letter not found</p>
            <Button 
              onClick={() => router.push('/dashboard/cover-letters')}
              className="mt-4"
            >
              Back to Cover Letters
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header with View All button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard/cover-letters')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Cover Letter Details</h1>
              <p className="text-muted-foreground">
                View and manage your cover letter
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => router.push('/dashboard/cover-letters')}
            >
              <List className="h-4 w-4 mr-2" />
              View All Cover Letters
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/cover-letters/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>

        {/* Cover Letter Info */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  {coverLetter.company_name}
                </CardTitle>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {coverLetter.job_title}
                </p>
              </div>
              <Badge variant={coverLetter.status === 'completed' ? 'default' : 'secondary'}>
                {coverLetter.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created: {format(new Date(coverLetter.created_at), 'MMM d, yyyy')}
              </div>
              {coverLetter.updated_at !== coverLetter.created_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Updated: {format(new Date(coverLetter.updated_at), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cover Letter Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Cover Letter Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
                {coverLetter.content}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Job Description (if available) */}
        {coverLetter.job_description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                {coverLetter.job_description}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}