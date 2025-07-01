// src/app/dashboard/cover-letters/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Wand2, Save, User, Home, BarChart, PenTool, Plus } from 'lucide-react'

interface Resume {
  id: string
  filename: string
  parsed_content: string | null
}

interface UserProfile {
  first_name: string | null
  last_name: string | null
}

export default function NewCoverLetterPage() {
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeId, setResumeId] = useState<string>('none')
  const [resumes, setResumes] = useState<Resume[]>([])
  const [generatedContent, setGeneratedContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetchingResumes, setFetchingResumes] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [tone, setTone] = useState<string>('professional')
  
  const router = useRouter()
  const supabase = createClient()

  // Define breadcrumbs for this page
  const breadcrumbs = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart },
    { name: 'Cover Letters', href: '/dashboard/cover-letters', icon: PenTool },
    { name: 'New', href: '/dashboard/cover-letters/new', icon: Plus }
  ]

  useEffect(() => {
    fetchUserProfile()
    fetchResumes()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('id, filename, parsed_content')
        .eq('is_active', true)
        .order('upload_date', { ascending: false })

      if (error) throw error
      setResumes(data || [])
    } catch (error) {
      console.error('Error fetching resumes:', error)
    } finally {
      setFetchingResumes(false)
    }
  }

  const handleGenerate = async () => {
    if (!companyName || !jobTitle) {
      alert('Please fill in company name and job title')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // Get user's full name
      const fullName = userProfile?.first_name && userProfile?.last_name 
        ? `${userProfile.first_name} ${userProfile.last_name}`
        : userProfile?.first_name || '[Your Name]'

      const response = await fetch('/api/cover-letters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          jobTitle,
          jobDescription,
          resumeId: resumeId === 'none' ? undefined : resumeId,
          userName: fullName,
          tone
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('API error response:', data)
        throw new Error(data.error || 'Failed to generate cover letter')
      }

      if (!data.content) {
        console.error('No content in response:', data)
        throw new Error('No content received from API')
      }

      console.log('Generated content received:', data.content.substring(0, 100) + '...')
      setGeneratedContent(data.content)
    } catch (error) {
      console.error('Error generating cover letter:', error)
      if (error instanceof Error) {
        alert(`Failed to generate cover letter: ${error.message}`)
      } else {
        alert('Failed to generate cover letter. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!companyName || !jobTitle || !generatedContent) {
      alert('Please generate a cover letter first')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data, error } = await supabase
        .from('cover_letters')
        .insert({
          user_id: user.id,
          title: `${jobTitle} at ${companyName}`,
          company_name: companyName,
          job_title: jobTitle,
          content: generatedContent,
          job_description: jobDescription || null,
          resume_id: resumeId === 'none' ? null : resumeId,
          resume_id: resumeId || null,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/dashboard/cover-letters/${data.id}`)
    } catch (error) {
      console.error('Error saving cover letter:', error)
      alert('Failed to save cover letter. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getUserDisplayName = () => {
    if (userProfile?.first_name) {
      return userProfile.first_name
    }
    return 'there'
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
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
              <h1 className="text-2xl font-bold">Create New Cover Letter</h1>
              <p className="text-muted-foreground">
                Generate a personalized cover letter for your job application
              </p>
            </div>
          </div>
        </div>

        {/* User Profile Notice */}
        {!userProfile?.first_name && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <User className="h-4 w-4" />
                <p className="text-sm">
                  Hi {getUserDisplayName()}! To personalize your cover letters with your name, 
                  please <a href="/dashboard/profile" className="underline font-medium">update your profile</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
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
              <Label htmlFor="resume">Select Resume (Optional)</Label>
              <Select value={resumeId} onValueChange={setResumeId}>
                <SelectTrigger id="resume">
                  <SelectValue placeholder="Choose a resume to use" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No resume selected</SelectItem>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fetchingResumes && (
                <p className="text-sm text-muted-foreground mt-1">Loading resumes...</p>
              )}
            </div>

            <div>
              <Label htmlFor="tone">Cover Letter Writing Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Select a tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional and Formal</SelectItem>
                  <SelectItem value="confident">Confident and Assertive</SelectItem>
                  <SelectItem value="friendly">Friendly and Conversational</SelectItem>
                  <SelectItem value="enthusiastic">Passionate and Enthusiastic</SelectItem>
                  <SelectItem value="humble">Humble and Appreciative</SelectItem>
                  <SelectItem value="direct">Direct and Concise</SelectItem>
                  <SelectItem value="creative">Creative and Unique</SelectItem>
                  <SelectItem value="personal">Personal and Reflective</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="jobDescription">Job Description (Optional)</Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here for a more tailored cover letter..."
                className="min-h-[150px]"
              />
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={loading || !companyName || !jobTitle}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Cover Letter
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Content */}
        {generatedContent && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Generated Cover Letter</CardTitle>
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
                      Save Cover Letter
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Your generated cover letter will appear here..."
              />
              <p className="text-sm text-muted-foreground mt-2">
                You can edit the content before saving
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}