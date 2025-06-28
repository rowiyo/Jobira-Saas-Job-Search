import { ResumeTemplate } from '@/lib/types/template'

export const resumeTemplates: ResumeTemplate[] = [
  // PDF Templates
  {
    id: 'pdf-professional',
    name: 'Professional Classic',
    category: 'pdf',
    thumbnail: '/templates/pdf/professional-thumb.png',
    description: 'Timeless design perfect for corporate roles',
    isPremium: false
  },
  {
    id: 'pdf-modern',
    name: 'Modern Minimal',
    category: 'pdf',
    thumbnail: '/templates/pdf/modern-thumb.png',
    description: 'Clean, ATS-friendly layout with a contemporary feel',
    isPremium: false
  },
  {
    id: 'pdf-executive',
    name: 'Executive Premium',
    category: 'pdf',
    thumbnail: '/templates/pdf/executive-thumb.png',
    description: 'Sophisticated design for senior positions',
    isPremium: true
  },
  
  // Google Docs Templates
  {
    id: 'gdoc-simple',
    name: 'Simple & Clean',
    category: 'google-docs',
    thumbnail: '/templates/gdocs/simple-thumb.png',
    description: 'Easy to edit in Google Docs',
    isPremium: false
  },
  
  // Text Templates
  {
    id: 'text-basic',
    name: 'Plain Text',
    category: 'text',
    thumbnail: '/templates/text/basic-thumb.png',
    description: 'Maximum ATS compatibility',
    isPremium: false
  },
  
  // Word Templates
  {
    id: 'word-traditional',
    name: 'Traditional',
    category: 'word',
    thumbnail: '/templates/word/traditional-thumb.png',
    description: 'Classic Word document format',
    isPremium: false
  }
]