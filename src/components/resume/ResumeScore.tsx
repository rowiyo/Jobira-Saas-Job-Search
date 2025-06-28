import React from 'react'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { ResumeScore } from '@/lib/types/template'

interface ResumeScoreProps {
  score: ResumeScore
}

export function ResumeScoreDisplay({ score }: ResumeScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Work'
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className={`text-5xl font-bold ${getScoreColor(score.overall)}`}>
          {score.overall}%
        </div>
        <p className="text-gray-600 mt-2">Resume Strength: {getScoreLabel(score.overall)}</p>
      </div>

      <div className="space-y-3 mb-6">
        {Object.entries(score.sections).map(([section, sectionScore]) => (
          <div key={section}>
            <div className="flex justify-between text-sm mb-1">
              <span className="capitalize">{section}</span>
              <span>{sectionScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  sectionScore >= 80 ? 'bg-green-500' : 
                  sectionScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${sectionScore}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          Top 5 Suggestions
        </h4>
        <ul className="space-y-2">
          {score.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="text-gray-400">{index + 1}.</span>
              <span className="text-gray-700">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}