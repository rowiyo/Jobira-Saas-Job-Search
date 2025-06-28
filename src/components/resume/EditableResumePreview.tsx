import React, { useState, useRef, useEffect } from 'react'
import { Save, Download, Mail, Edit3, Plus, Trash2 } from 'lucide-react'


// Editable text component
const EditableText = ({ 
  value, 
  onChange, 
  className = "", 
  placeholder = "Click to edit",
  multiline = false,
  tag = "span"
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current.type === 'textarea') {
        inputRef.current.style.height = 'auto'
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
      }
    }
  }, [isEditing])

  const handleSave = () => {
    onChange(tempValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const Tag = tag

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${className} w-full resize-none border-0 outline-none bg-blue-50 px-1 rounded`}
          rows={1}
        />
      )
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`${className} border-0 outline-none bg-blue-50 px-1 rounded min-w-[100px]`}
      />
    )
  }

  return (
    <Tag
      className={`${className} cursor-pointer hover:bg-gray-100 px-1 rounded transition-colors ${!value && 'text-gray-400'}`}
      onClick={() => setIsEditing(true)}
    >
      {value || placeholder}
    </Tag>
  )
}

// Editable list component for skills, experience items, etc.
const EditableList = ({ items, onChange, placeholder = "Add item" }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newItem, setNewItem] = useState("")

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()])
      setNewItem("")
      setIsAdding(false)
    }
  }

  const handleRemove = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleEdit = (index, newValue) => {
    const updated = [...items]
    updated[index] = newValue
    onChange(updated)
  }

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 group">
          <span className="text-sm">•</span>
          <EditableText
            value={item}
            onChange={(value) => handleEdit(index, value)}
            className="flex-1 text-sm"
          />
          <button
            onClick={() => handleRemove(index)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      {isAdding ? (
        <div className="flex items-center gap-2">
          <span className="text-sm">•</span>
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onBlur={handleAdd}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setIsAdding(false)
            }}
            className="flex-1 text-sm border-0 outline-none bg-blue-50 px-1 rounded"
            placeholder={placeholder}
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add item
        </button>
      )}
    </div>
  )
}

// Main editable resume component
export default function EditableResumePreview({ 
  initialData = {}, 
  onSave,
  onDownload,
  onEmail,
  templateId 
}) {
  const [resumeData, setResumeData] = useState({
    personalInfo: {
      name: "Robert Young",
      email: "rowiyo@gmail.com",
      phone: "603-235-6116",
      location: "Pelham, NH",
      linkedin: "linkedin.com/in/rowiyo"
    },
    summary: "Seasoned Quality Assurance Manager with expertise in Agile methodologies, automation, and compliance testing. Proven track record of leading teams, enhancing software quality, and ensuring regulatory adherence across industries.",
    experience: [
      {
        company: "TraceLink",
        location: "North Reading, MA",
        title: "Principal QA Engineer",
        dates: "07/2022 – 01/2025",
        responsibilities: [
          "Investigated and resolved escalated defects",
          "Executed comprehensive testing for the frame project",
          "Led a cross-functional team managing nightly automated tests"
        ]
      }
    ],
    education: [
      {
        degree: "Associate of Science (AS)",
        field: "Business Administration",
        school: "Northern Essex Community College",
        status: "Completed"
      }
    ],
    skills: ["Agile Methodologies", "Test Automation", "JIRA", "Python", "Selenium"],
    coreCompetencies: ["Team Leadership", "Strategic Planning", "Process Optimization"],
    ...initialData
  })

  const [hasChanges, setHasChanges] = useState(false)

  const updateField = (path, value) => {
    setResumeData(prev => {
      const updated = { ...prev }
      const keys = path.split('.')
      let current = updated
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      setHasChanges(true)
      return updated
    })
  }

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        company: "Company Name",
        location: "City, State",
        title: "Job Title",
        dates: "Start Date - End Date",
        responsibilities: ["Responsibility 1"]
      }]
    }))
    setHasChanges(true)
  }
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const removeExperience = (index) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    if (onSave) {
      onSave(resumeData)
    }
    setHasChanges(false)
  }

 const handleDownload = () => {
  if (onDownload) {
    onDownload()
  }
}

const handleEmail = () => {
setShowEmailDialog(true)
  console.log('Email button clicked', onEmail)  // Add this line
  if (onEmail) {
    onEmail()
  }
}

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Edit3 className="w-4 h-4" />
          Click any text to edit directly
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              hasChanges 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handleEmail}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        </div>
      </div>

      {/* Resume Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8 border-b pb-6">
          <EditableText
            value={resumeData.personalInfo.name}
            onChange={(value) => updateField('personalInfo.name', value)}
            className="text-3xl font-bold text-gray-800 mb-2 block"
            tag="h1"
          />
          <div className="text-sm text-gray-600 space-x-3">
            <EditableText
              value={resumeData.personalInfo.location}
              onChange={(value) => updateField('personalInfo.location', value)}
            />
            <span>•</span>
            <EditableText
              value={resumeData.personalInfo.phone}
              onChange={(value) => updateField('personalInfo.phone', value)}
            />
            <span>•</span>
            <EditableText
              value={resumeData.personalInfo.email}
              onChange={(value) => updateField('personalInfo.email', value)}
            />
            <span>•</span>
            <EditableText
              value={resumeData.personalInfo.linkedin}
              onChange={(value) => updateField('personalInfo.linkedin', value)}
            />
          </div>
        </div>

        {/* Professional Summary */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">PROFESSIONAL SUMMARY</h2>
          <EditableText
            value={resumeData.summary}
            onChange={(value) => updateField('summary', value)}
            className="text-gray-700 leading-relaxed block"
            multiline={true}
            tag="p"
          />
        </section>

        {/* Core Competencies */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">CORE COMPETENCIES</h2>
          <div className="grid grid-cols-2 gap-x-8">
            <EditableList
              items={resumeData.coreCompetencies}
              onChange={(value) => updateField('coreCompetencies', value)}
              placeholder="Add competency"
            />
          </div>
        </section>

        {/* Professional Experience */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">PROFESSIONAL EXPERIENCE</h2>
          {resumeData.experience.map((exp, index) => (
            <div key={index} className="mb-6 relative group">
              <button
                onClick={() => removeExperience(index)}
                className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="mb-2">
                <EditableText
                  value={exp.company}
                  onChange={(value) => updateField(`experience.${index}.company`, value)}
                  className="font-semibold text-gray-800"
                />
                <span className="mx-2">•</span>
                <EditableText
                  value={exp.location}
                  onChange={(value) => updateField(`experience.${index}.location`, value)}
                  className="text-gray-600"
                />
                <span className="mx-2">•</span>
                <EditableText
                  value={exp.dates}
                  onChange={(value) => updateField(`experience.${index}.dates`, value)}
                  className="text-gray-600"
                />
              </div>
              
              <EditableText
                value={exp.title}
                onChange={(value) => updateField(`experience.${index}.title`, value)}
                className="font-medium text-gray-700 mb-2 block"
                tag="div"
              />
              
              <EditableList
                items={exp.responsibilities}
                onChange={(value) => updateField(`experience.${index}.responsibilities`, value)}
                placeholder="Add responsibility"
              />
            </div>
          ))}
          
          <button
            onClick={addExperience}
            className="mt-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Experience
          </button>
        </section>

        {/* Education */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">EDUCATION</h2>
          {resumeData.education.map((edu, index) => (
            <div key={index} className="mb-3">
              <EditableText
                value={edu.degree}
                onChange={(value) => updateField(`education.${index}.degree`, value)}
                className="font-semibold"
              />
              <span className="mx-1">in</span>
              <EditableText
                value={edu.field}
                onChange={(value) => updateField(`education.${index}.field`, value)}
                className="font-medium"
              />
              <span className="mx-1">•</span>
              <EditableText
                value={edu.school}
                onChange={(value) => updateField(`education.${index}.school`, value)}
                className="text-gray-600"
              />
              {edu.status && (
                <>
                  <span className="mx-1">•</span>
                  <EditableText
                    value={edu.status}
                    onChange={(value) => updateField(`education.${index}.status`, value)}
                    className="text-gray-600 italic"
                  />
                </>
              )}
            </div>
          ))}
        </section>

        {/* Skills */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">SKILLS</h2>
          <EditableList
            items={resumeData.skills}
            onChange={(value) => updateField('skills', value)}
            placeholder="Add skill"
          />
        </section>
      </div>
    </div>
  )
}