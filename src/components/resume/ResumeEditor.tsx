import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Save, X, Wand2 } from 'lucide-react'

interface ResumeEditorProps {
  resumeData: any
  onSave: (data: any) => void
  onCancel: () => void
  onAutoFix: () => void
}

export function ResumeEditor({ resumeData, onSave, onCancel, onAutoFix }: ResumeEditorProps) {
  const [formData, setFormData] = useState(resumeData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Edit Resume</CardTitle>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onAutoFix}
              className="bg-purple-50 text-purple-600 hover:bg-purple-100"
            >
              <Wand2 className="h-4 w-4 mr-1" />
              Auto-Fix Errors
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Section */}
          <div>
            <h3 className="font-semibold mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Full Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <Input
                placeholder="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <Input
                placeholder="Phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <Input
                placeholder="Location"
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>

          {/* Summary Section */}
          <div>
            <h3 className="font-semibold mb-3">Professional Summary</h3>
            <Textarea
              placeholder="Write a compelling summary..."
              rows={4}
              value={formData.summary || ''}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}