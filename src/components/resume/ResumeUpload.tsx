'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface ResumeUploadProps {
  onUploadSuccess?: (resume: any) => void
}

export function ResumeUpload({ onUploadSuccess }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setSuccess(null)
    setUploading(true)

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to upload a resume')
      }

      // Upload file to Supabase Storage
      const fileName = `${session.user.id}/${Date.now()}_${file.name}`
      
      console.log('Uploading file:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log('File uploaded successfully:', uploadData)

      // Save resume record to database
      const { data: resumeData, error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: session.user.id,
          filename: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          is_active: true
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        throw new Error(`Database error: ${dbError.message}`)
      }

      console.log('Resume record created:', resumeData)

      setUploading(false)
      setParsing(true)

      let extractedText = ''
if (file.type === 'application/pdf') {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      extractedText += pageText + ' '
    }
    console.log('Extracted text length:', extractedText.length)
  } catch (error) {
    console.error('Client-side PDF extraction failed:', error)
  }
}

      // Parse resume with AI
      const parseResponse = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resumeData.id,
          filePath: uploadData.path,
          fileContent: extractedText 
        })
      })

      if (!parseResponse.ok) {
  const errorText = await parseResponse.text()
  console.error('API Error Response:', errorText)
  throw new Error(`API Error (${parseResponse.status}): ${errorText.substring(0, 200)}...`)
}

      const parseResult = await parseResponse.json()
      console.log('Parse result:', parseResult)

      //Logging for resume parsing
      console.log('Extracted data details:', JSON.stringify(parseResult.extractedData, null, 2))

      setParsing(false)
      setSuccess('Resume uploaded and parsed successfully!')
      
      if (onUploadSuccess) {
        onUploadSuccess(parseResult.resume)
      }

    } catch (err: any) {
      console.error('Upload/parse error:', err)
      setError(err.message)
      setUploading(false)
      setParsing(false)
    }
  }, [onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploading || parsing
  })

  const isProcessing = uploading || parsing

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Resume
        </CardTitle>
        <CardDescription>
          Upload your resume in PDF, DOC, or DOCX format (max 5MB). 
          Our AI will extract your skills, experience, and other key information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isDragReject ? 'border-red-400 bg-red-50' : ''}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-4">
            {isProcessing ? (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
            
            <div>
              {uploading && (
                <p className="text-lg font-medium text-blue-600">
                  Uploading your resume...
                </p>
              )}
              {parsing && (
                <p className="text-lg font-medium text-purple-600">
                  Parsing resume with AI...
                </p>
              )}
              {!isProcessing && (
                <>
                  {isDragActive ? (
                    <p className="text-lg font-medium text-blue-600">
                      Drop your resume here
                    </p>
                  ) : (
                    <p className="text-lg font-medium text-gray-700">
                      Drag & drop your resume here, or click to browse
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Supports PDF, DOC, and DOCX files
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800">Upload Error</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-800">Success!</h4>
              <p className="text-green-700 text-sm mt-1">{success}</p>
            </div>
          </div>
        )}

        {!isProcessing && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => document.querySelector('input[type="file"]')?.click()}
            >
              Or click to select file
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}