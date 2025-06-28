export interface ResumeTemplate {
  id: string
  name: string
  category: 'pdf' | 'google-docs' | 'text' | 'word'
  thumbnail: string
  description: string
  isPremium: boolean
}

export interface ResumeScore {
  overall: number
  sections: {
    contact: number
    experience: number
    education: number
    skills: number
    formatting: number
  }
  suggestions: string[]
}