'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Briefcase, DollarSign, X, Loader2 } from 'lucide-react'

interface ManualSearchFormProps {
  onSearch: (searchParams: ManualSearchParams) => void
  isSearching: boolean
}

export interface ManualSearchParams {
  jobTitle: string
  location: string
  locationType: 'remote' | 'hybrid' | 'onsite' | 'any'
  salaryMin?: number
  salaryMax?: number
  experienceLevel?: string
  keywords: string[]
}

export function ManualSearchForm({ onSearch, isSearching }: ManualSearchFormProps) {
  const [searchParams, setSearchParams] = useState<ManualSearchParams>({
    jobTitle: '',
    location: '',
    locationType: 'any',
    keywords: []
  })
  
  const [keywordInput, setKeywordInput] = useState('')
  const [errors, setErrors] = useState<{jobTitle?: string, location?: string}>({})

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (3-5 years)' },
    { value: 'senior', label: 'Senior Level (6-10 years)' },
    { value: 'lead', label: 'Lead/Principal (10+ years)' },
    { value: 'executive', label: 'Executive/C-Level' }
  ]

  const addKeyword = () => {
    if (keywordInput.trim() && !searchParams.keywords.includes(keywordInput.trim())) {
      setSearchParams(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }))
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setSearchParams(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: {jobTitle?: string, location?: string} = {}
    if (!searchParams.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required'
    }
    if (!searchParams.location.trim()) {
      newErrors.location = 'Location is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    onSearch(searchParams)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Job Title */}
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Title *
          </Label>
          <Input
            id="jobTitle"
            type="text"
            value={searchParams.jobTitle}
            onChange={(e) => {
              setSearchParams(prev => ({ ...prev, jobTitle: e.target.value }))
              if (errors.jobTitle) setErrors(prev => ({ ...prev, jobTitle: undefined }))
            }}
            placeholder="e.g., Software Engineer, Product Manager"
            className={errors.jobTitle ? 'border-red-500' : ''}
          />
          {errors.jobTitle && (
            <p className="text-sm text-red-500">{errors.jobTitle}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location *
          </Label>
          <Input
            id="location"
            type="text"
            value={searchParams.location}
            onChange={(e) => {
              setSearchParams(prev => ({ ...prev, location: e.target.value }))
              if (errors.location) setErrors(prev => ({ ...prev, location: undefined }))
            }}
            placeholder="e.g., San Francisco, CA or New York"
            className={errors.location ? 'border-red-500' : ''}
          />
          {errors.location && (
            <p className="text-sm text-red-500">{errors.location}</p>
          )}
        </div>

        {/* Work Type */}
        <div className="space-y-2">
          <Label htmlFor="locationType">Work Type</Label>
          <Select
            value={searchParams.locationType}
            onValueChange={(value: any) => setSearchParams(prev => ({ ...prev, locationType: value }))}
          >
            <SelectTrigger id="locationType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="remote">Remote Only</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <Label htmlFor="experienceLevel">Experience Level</Label>
          <Select
            value={searchParams.experienceLevel}
            onValueChange={(value) => setSearchParams(prev => ({ ...prev, experienceLevel: value }))}
          >
            <SelectTrigger id="experienceLevel">
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              {experienceLevels.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Salary Range */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Salary Range (Optional)
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              type="number"
              value={searchParams.salaryMin || ''}
              onChange={(e) => setSearchParams(prev => ({ 
                ...prev, 
                salaryMin: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="Min (e.g., 50000)"
            />
          </div>
          <div>
            <Input
              type="number"
              value={searchParams.salaryMax || ''}
              onChange={(e) => setSearchParams(prev => ({ 
                ...prev, 
                salaryMax: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="Max (e.g., 150000)"
            />
          </div>
        </div>
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <Label htmlFor="keywords">Keywords & Skills (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="keywords"
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Add skills or keywords (e.g., React, Python, AWS)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addKeyword()
              }
            }}
          />
          <Button type="button" onClick={addKeyword} variant="outline">
            Add
          </Button>
        </div>
        {searchParams.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {searchParams.keywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200"
                onClick={() => removeKeyword(keyword)}
              >
                {keyword}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Search Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Search className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Ready to search across 10+ job boards:</p>
              <p className="text-sm text-blue-700 mt-1">
                {searchParams.jobTitle || '[Job Title]'} in {searchParams.location || '[Location]'}
                {searchParams.locationType !== 'any' && ` • ${searchParams.locationType}`}
                {searchParams.experienceLevel && ` • ${experienceLevels.find(l => l.value === searchParams.experienceLevel)?.label}`}
                {searchParams.keywords.length > 0 && ` • Skills: ${searchParams.keywords.join(', ')}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700" 
        size="lg"
        disabled={isSearching}
      >
        {isSearching ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Searching across job boards...
          </>
        ) : (
          <>
            <Search className="mr-2 h-5 w-5" />
            Search Jobs Across All Boards
          </>
        )}
      </Button>
    </form>
  )
}