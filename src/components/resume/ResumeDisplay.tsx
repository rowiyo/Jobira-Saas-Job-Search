import React from 'react'
import { Card } from '@/components/ui/card'
import { Mail, Phone, MapPin, Linkedin, Calendar, Building } from 'lucide-react'

interface ResumeData {
  personalInfo: {
    name: string
    email: string
    phone: string
    location: string
    linkedin?: string
  }
  summary: string
  experience: Array<{
    company: string
    location: string
    title: string
    dates: string
    responsibilities: string[]
    achievements?: string[]
  }>
  education: Array<{
    degree: string
    field: string
    school: string
    status: string
  }>
  skills: string[]
  certifications?: string[]
  coreCompetencies?: string[]
}

interface ResumeDisplayProps {
  resumeData: ResumeData
  className?: string
}

export const ResumeDisplay: React.FC<ResumeDisplayProps> = ({ resumeData, className = '' }) => {
  if (!resumeData) return null

  return (
    <Card className={`p-8 max-w-4xl mx-auto bg-white shadow-lg ${className}`}>
      {/* Header Section */}
      <div className="border-b-2 border-gray-200 pb-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          {resumeData.personalInfo.name}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {resumeData.personalInfo.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span>{resumeData.personalInfo.email}</span>
            </div>
          )}
          {resumeData.personalInfo.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span>{resumeData.personalInfo.phone}</span>
            </div>
          )}
          {resumeData.personalInfo.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{resumeData.personalInfo.location}</span>
            </div>
          )}
          {resumeData.personalInfo.linkedin && (
            <div className="flex items-center gap-1">
              <Linkedin className="w-4 h-4" />
              <a 
                href={resumeData.personalInfo.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                LinkedIn Profile
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      {resumeData.summary && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 uppercase tracking-wide">
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {resumeData.summary}
          </p>
        </div>
      )}

      {/* Core Competencies */}
      {resumeData.coreCompetencies && resumeData.coreCompetencies.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 uppercase tracking-wide">
            Core Competencies
          </h2>
          <div className="flex flex-wrap gap-2">
            {resumeData.coreCompetencies.map((competency, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {competency}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Professional Experience */}
      {resumeData.experience && resumeData.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 uppercase tracking-wide">
            Professional Experience
          </h2>
          <div className="space-y-6">
            {resumeData.experience.map((job, index) => (
              <div key={index} className="relative">
                {/* Timeline dot */}
                {index < resumeData.experience.length - 1 && (
                  <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                )}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-4 h-4 bg-blue-600 rounded-full mt-1"></div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        <span className="font-medium">{job.company}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{job.dates}</span>
                      </div>
                    </div>
                    
                    {job.responsibilities && job.responsibilities.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                        {job.responsibilities.map((resp, idx) => (
                          <li key={idx}>{resp}</li>
                        ))}
                      </ul>
                    )}
                    
                    {job.achievements && job.achievements.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-gray-700 text-sm">Key Achievements:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                          {job.achievements.map((achievement, idx) => (
                            <li key={idx}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resumeData.education && resumeData.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 uppercase tracking-wide">
            Education
          </h2>
          <div className="space-y-3">
            {resumeData.education.map((edu, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-800">
                  {edu.degree} in {edu.field}
                </h3>
                <p className="text-gray-600">
                  {edu.school} 
                  {edu.status && <span className="italic"> - {edu.status}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {resumeData.skills && resumeData.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 uppercase tracking-wide">
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((skill, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {resumeData.certifications && resumeData.certifications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3 uppercase tracking-wide">
            Certifications
          </h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {resumeData.certifications.map((cert, index) => (
              <li key={index}>{cert}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}