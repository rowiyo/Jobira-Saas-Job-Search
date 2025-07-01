'use client'

import { useParams } from 'next/navigation'

export default function CoverLetterPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold">Cover Letter Editor</h1>
      <p>Cover Letter ID: {id}</p>
      <p>This page will show the cover letter editor.</p>
    </div>
  )
}