import React from 'react'
import { Card } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { ResumeTemplate } from '@/lib/types/template'

function TemplateThumbnail({ category }: { category: string }) {
  const getTemplateStyle = () => {
    switch (category) {
      case 'pdf':
        return 'bg-white border-2 border-gray-300'
      case 'google-docs':
        return 'bg-blue-50 border-2 border-blue-300'
      case 'text':
        return 'bg-gray-100 border-2 border-gray-400'
      case 'word':
        return 'bg-blue-100 border-2 border-blue-400'
      default:
        return 'bg-white border-2 border-gray-300'
    }
  }

  return (
    <div className={`w-full h-48 rounded-t-lg ${getTemplateStyle()} p-4`}>
      <div className="h-full flex flex-col">
        <div className="space-y-2 mb-3">
          <div className="h-2 bg-gray-400 rounded w-3/4"></div>
          <div className="h-2 bg-gray-300 rounded w-1/2"></div>
        </div>
        <div className="space-y-1.5 flex-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-1.5 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
        <div className="text-xs font-medium text-gray-500 mt-2 uppercase">
          {category.replace('-', ' ')}
        </div>
      </div>
    </div>
  )
}


interface TemplateSelectorProps {
  templates: ResumeTemplate[]
  selectedTemplate: string | null
  onSelect: (templateId: string) => void
}

export function TemplateSelector({ templates, selectedTemplate, onSelect }: TemplateSelectorProps) {
  const categories = ['pdf', 'google-docs', 'text', 'word']
  
  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-3 capitalize">{category.replace('-', ' ')} Templates</h3>
          <div className="grid grid-cols-3 gap-4">
            {templates
              .filter(t => t.category === category)
              .map(template => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplate === template.id ? 'ring-2 ring-blue-600' : ''
                  }`}
                  onClick={() => onSelect(template.id)}
                >
                  <div className="relative">
                    <TemplateThumbnail category={template.category} />
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}