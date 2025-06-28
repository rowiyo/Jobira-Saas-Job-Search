import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Mail, Printer, Edit, Loader2, Save, X } from 'lucide-react'
import { downloadResume, emailResume } from '@/utils/export-resume'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import EditableResumePreview from './EditableResumePreview'
import { ResumeDisplay } from '@/components/resume/ResumeDisplay'

interface ResumePreviewProps {
  resumeContent: string
  templateId: string
  resumeName?: string
  resumeData?: any // The parsed resume data
  onEdit: () => void
  onSave?: (updatedData: any) => void // Callback when edits are saved
}

export function ResumePreview({ 
  resumeContent, 
  templateId, 
  resumeName = 'resume', 
  resumeData,
  onEdit,
  onSave
}: ResumePreviewProps) {
  const [downloading, setDownloading] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const handleDownload = async (format: 'pdf' | 'txt') => {
    setDownloading(true)
    await downloadResume(resumeContent, resumeName, format)
    setDownloading(false)
  }

  const handleEmail = async () => {
    setSending(true)
    await emailResume(resumeContent, email)
    setSending(false)
    setShowEmailDialog(false)
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleSave = (updatedData: any) => {
    // Call the parent's save function
    if (onSave) {
      onSave(updatedData)
    }
    // Exit edit mode after saving
    setIsEditMode(false)
  }

  const handleCancel = () => {
    setIsEditMode(false)
  }

  // If in edit mode, show the editable version
  if (isEditMode) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit Resume</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCancel}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
        
        <EditableResumePreview 
          initialData={resumeData}
          onSave={handleSave}
          onDownload={() => handleDownload('pdf')}
          onEmail={() => setShowEmailDialog(true)}
          templateId={templateId}
        />
      </div>
    )
  }

  // Otherwise show the formatted resume with ResumeDisplay
  return (
    <>
      <div className="relative">
        {/* Move button outside and increase z-index */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => {
              setIsEditMode(true)
            }}
            variant="outline"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Resume
          </Button>
        </div>
        
        {/* Use ResumeDisplay for formatted view */}
        <ResumeDisplay resumeData={resumeData} />
      </div>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Resume</DialogTitle>
            <DialogDescription>
              Enter your email address to receive your resume
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button 
              onClick={handleEmail} 
              disabled={!email || sending}
              className="w-full"
            >
              {sending ? 'Sending...' : 'Send Resume'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}