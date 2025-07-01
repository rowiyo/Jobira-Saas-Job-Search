'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface ResumeSkeletonLoaderProps {
  stage: 'uploading' | 'processing' | 'extracting' | 'finalizing'
  fileName?: string
}

const ResumeSkeletonLoader: React.FC<ResumeSkeletonLoaderProps> = ({ stage, fileName }) => {
  const stages = {
    uploading: { text: 'Uploading your resume...', progress: 25 },
    processing: { text: 'AI analyzing document structure...', progress: 50 },
    extracting: { text: 'AI is extracting skills and experience...', progress: 75 },
    finalizing: { text: 'Finalizing your profile...', progress: 90 }
  }

  const currentStage = stages[stage]

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{currentStage.text}</span>
          <span className="text-gray-500">{currentStage.progress}%</span>
        </div>
        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden border border-gray-600">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-blue-600 via-gray-600 to-green-600 
                       rounded-full transition-all duration-700 ease-out bg-[length:200%_100%] 
                       animate-shimmer"
            style={{ width: `${currentStage.progress}%` }}
          />
        </div>
      </div>

      {/* Resume skeleton preview */}
      <Card className="p-8 bg-white border-2 border-gray-100 relative overflow-hidden">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer-slide bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        
        {/* Header skeleton */}
        <div className="space-y-4 mb-8">
          <div className="h-8 bg-gray-300 rounded w-1/3 animate-pulse" />
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-300 rounded w-1/4 animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-1/4 animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-1/4 animate-pulse" />
          </div>
        </div>

        {/* Summary skeleton */}
        <div className="space-y-3 mb-8">
          <div className="h-5 bg-gray-300 rounded w-1/4 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse" />
          </div>
        </div>

        {/* Experience skeleton */}
        <div className="space-y-6">
          <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
          
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3 pl-4 border-l-2 border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-50 rounded w-5/6 animate-pulse" />
                <div className="h-3 bg-gray-50 rounded w-4/5 animate-pulse" />
                <div className="h-3 bg-gray-50 rounded w-5/6 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Skills skeleton */}
        <div className="mt-8 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
            ))}
          </div>
        </div>
      </Card>

      {/* Status indicators */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className={`flex items-center space-x-2 ${stage === 'uploading' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${stage === 'uploading' ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'}`} />
          <span>Upload</span>
        </div>
        <div className={`flex items-center space-x-2 ${stage === 'processing' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${stage === 'processing' ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'}`} />
          <span>Process</span>
        </div>
        <div className={`flex items-center space-x-2 ${stage === 'extracting' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${stage === 'extracting' ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'}`} />
          <span>Extract</span>
        </div>
        <div className={`flex items-center space-x-2 ${stage === 'finalizing' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${stage === 'finalizing' ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'}`} />
          <span>Finalize</span>
        </div>
      </div>
    </div>
  )
}

interface ResumeUploadProps {
  onUploadSuccess?: (resume: any) => void
}

export function ResumeUpload({ onUploadSuccess }: ResumeUploadProps) {
  const supabase = createClient() 
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processingStage, setProcessingStage] = useState<'uploading' | 'processing' | 'extracting' | 'finalizing'>('uploading')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadedFile(file)
    setError(null)
    setSuccess(null)
    setUploading(true)
    setProcessingStage('uploading')
    //added delay
    await new Promise(resolve => setTimeout(resolve, 1000))

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
      setProcessingStage('processing')
      //Added delay
      await new Promise(resolve => setTimeout(resolve, 1500))

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
      setProcessingStage('extracting')
      //added delay after extracting
      await new Promise(resolve => setTimeout(resolve, 800))

      let extractedText = ''
      if (file.type === 'application/pdf') {
        try {
          // Use the legacy build that doesn't require a worker
          const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf')
          
          if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = ''
        }
          

          const arrayBuffer = await file.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          
          console.log('PDF loaded successfully')
          console.log('Pages:', pdf.numPages)
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
            extractedText += pageText + ' '
          }
          
          console.log('PDF parsing successful!')
          console.log('Extracted text length:', extractedText.length)
          console.log('First 1000 chars:', extractedText.substring(0, 1000))
          
        } catch (pdfError) {
          console.error('PDF extraction error:', pdfError)
          // Don't throw - continue with empty text and let server handle it
        }
      }
      //delay after pdf extraction
      await new Promise(resolve => setTimeout(resolve, 500))
      
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

      setProcessingStage('finalizing')
      //delay on finalizing
      await new Promise(resolve => setTimeout(resolve, 1200))

      const parseResult = await parseResponse.json()
      console.log('Parse result:', parseResult)

      // Logging for resume parsing
      console.log('Extracted data details:', JSON.stringify(parseResult.extractedData, null, 2))

      setParsing(false)
      setSuccess('Resume uploaded and parsed successfully!')
      //delay before success
      await new Promise(resolve => setTimeout(resolve, 500))

      if (onUploadSuccess) {
        onUploadSuccess(parseResult.resume)
      }

    } catch (err: any) {
      console.error('Upload/parse error:', err)
      setError(err.message)
      setUploading(false)
      setParsing(false)
    }
  }, [onUploadSuccess, supabase])

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
              <ResumeSkeletonLoader 
                stage={processingStage} 
                fileName={uploadedFile?.name}
              />
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
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
                </div>
              </>
            )}
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