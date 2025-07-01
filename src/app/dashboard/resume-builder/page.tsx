'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, Home, BarChart, FileText } from 'lucide-react'
import { TemplateSelector } from '@/components/resume/TemplateSelector'
import { ResumeUpload } from '@/components/resume/ResumeUpload'
import { ResumeScoreDisplay } from '@/components/resume/ResumeScore'
import { ResumeTemplate, ResumeScore } from '@/lib/types/template'
import { resumeTemplates } from '@/lib/data/templates'
import { ResumeEditor } from '@/components/resume/ResumeEditor'
import { ResumePreview } from '@/components/resume/ResumePreview'
import { ResumeDisplay } from '@/components/resume/ResumeDisplay'

// Mock templates - replace with actual data
const templates: ResumeTemplate[] = [
  {
    id: '1',
    name: 'Professional',
    category: 'pdf',
    thumbnail: '/templates/professional-thumb.png',
    description: 'Clean and modern design',
    isPremium: false
  },
  // Add more templates
]

export default function ResumeBuilder() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [uploadedResume, setUploadedResume] = useState<any>(null)
  const [resumeScore, setResumeScore] = useState<ResumeScore | null>(null)
  const [convertedResume, setConvertedResume] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [editingData, setEditingData] = useState<any>(null)
  const [resumeData, setResumeData] = useState<any>(null)

  // Define breadcrumbs for this page
  const breadcrumbs = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart },
    { name: 'Resume Builder', href: '/dashboard/resume-builder', icon: FileText }
  ]

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
  }

  const handleResumeUpload = async (resume: any) => {
    setUploadedResume(resume)
    setResumeData(resume.extracted_keywords || resume.extractedData)  // Add this line
    console.log('Resume data set to:', resume.extracted_keywords || resume.extractedData)  // Add this line
    await convertResumeToTemplate(resume, selectedTemplate!)
  }

  const handleSaveEdit = async (data: any) => {
    // Update the uploadedResume with new data
    const updatedResume = {
      ...uploadedResume,
      extracted_keywords: data,
      extractedData: data
    }
    
    setUploadedResume(updatedResume)  // Update the source
    setResumeData(data)  // Update the display
    setEditingData(data)  // Update editing data
    
    // Reconvert with new data
    await convertResumeToTemplate(updatedResume, selectedTemplate!)
  }

  const handleAutoFix = async () => {
    // Auto-fix logic here
    console.log('Auto-fixing...')
  }

  const handleOptimizeForATS = async () => {
    console.log('Optimizing for ATS...')
    // Add your ATS optimization logic here
    // You can navigate to the ATS optimization page or call an API
    router.push(`/dashboard/ats-optimization?resumeId=${uploadedResume.id}`)
  }

  const convertResumeToTemplate = async (resume: any, templateId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/convert-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: resume.id,
          templateId: templateId,
          userId: resume.user_id
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setResumeScore(result.score)
        setConvertedResume(result.content)
        setStep(3)
      }
    } catch (error) {
      console.error('Conversion error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'
              }`}>1</div>
              <span className="ml-2">Choose Template</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'
              }`}>2</div>
              <span className="ml-2">Upload Resume</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'
              }`}>3</div>
              <span className="ml-2">Review & Download</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-bold text-center mb-8">Choose a Resume Template</h1>
            <TemplateSelector
              templates={resumeTemplates}
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateSelect}
            />
            <div className="mt-8 text-center">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Upload Your Resume</h1>
            <ResumeUpload onUploadSuccess={handleResumeUpload} />
            <div className="mt-8 text-center">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            {/* Page Title */}
            <h1 className="text-3xl font-bold text-center mb-8">Your Resume</h1>
            
            {/* Action Buttons - Above the resume (removed Edit button) */}
            <div className="flex gap-4 justify-center mb-8">
              <Button 
                onClick={() => handleOptimizeForATS()} 
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Optimize for ATS
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Add download functionality here
                  console.log('Download resume')
                }}
                size="lg"
              >
                Download PDF
              </Button>
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Upload Different Resume
              </Button>
            </div>
            
            {/* Grid Layout: Resume on left, Score on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ResumePreview handles both display and inline editing */}
              <div className="lg:col-span-2">
                <ResumePreview
                  resumeContent={convertedResume}
                  templateId={selectedTemplate!}
                  resumeName={uploadedResume?.filename?.replace('.pdf', '')}
                  resumeData={resumeData}
                  onEdit={() => {}} // Empty function since ResumePreview handles its own editing
                  onSave={handleSaveEdit}
                />
              </div>
              
              {/* Score Display */}
              <div className="lg:col-span-1">
                <ResumeScoreDisplay score={resumeScore} resumeData={resumeData} />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}