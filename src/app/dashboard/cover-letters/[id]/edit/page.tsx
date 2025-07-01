// src/app/dashboard/cover-letters/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, Save } from 'lucide-react'

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

export default function EditCoverLetterPage() {
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [content, setContent] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'completed'>('draft')
  
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const id = params.id as string

  useEffect(() => {
    if (id) {
      fetchCoverLetter()
    }
  }, [id])

  const fetchCoverLetter = async () => {
    try {
      const { data, error } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      setCoverLetter(data)
      setCompanyName(data.company_name)
      setJobTitle(data.job_title)
      setContent(data.content)
      setJobDescription(data.job_description || '')
      setStatus(data.status)
    } catch (error) {
      console.error('Error fetching cover letter:', error)
      router.push('/dashboard/cover-letters')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!companyName || !jobTitle || !content) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('cover_letters')
        .update({
          company_name: companyName,
          job_title: jobTitle,
          content: content,
          job_description: jobDescription || null,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      
      router.push(`/dashboard/cover-letters/${id}`)
    } catch (error) {
      console.error('Error updating cover letter:', error)
      alert('Failed to update cover letter. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!coverLetter) {
    return (
      <div className="container mx-auto p-6">
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
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/cover-letters/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Cover Letter</h1>
            <p className="text-muted-foreground">
              Update your cover letter details
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Cover Letter Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Google"
                required
              />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Software Engineer"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Cover Letter Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your cover letter content..."
              className="min-h-[400px] font-mono text-sm"
              required
            />
          </div>

          <div>
            <Label htmlFor="jobDescription">Job Description (Optional)</Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here for reference..."
              className="min-h-[200px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}