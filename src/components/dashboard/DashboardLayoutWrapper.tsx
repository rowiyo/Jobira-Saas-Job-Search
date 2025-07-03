// components/dashboard/DashboardLayoutWrapper.tsx
import React, { useState, useEffect } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Gauge, Upload, FileText, Search, Layers, 
  PenTool, Star, Menu, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardLayoutWrapperProps {
  children: React.ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
  resumes: any[]
  user: any
  profile: any
  notifications: any[]
  unreadCount: number
  onLogout: () => void
  useSidebar?: boolean
}

export const DashboardLayoutWrapper = ({
  children,
  activeTab,
  setActiveTab,
  resumes,
  user,
  profile,
  notifications,
  unreadCount,
  onLogout,
  useSidebar = false
}: DashboardLayoutWrapperProps) => {
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Load saved sidebar preference
  useEffect(() => {
    if (useSidebar) {
      const saved = localStorage.getItem('sidebarCollapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    }
  }, [useSidebar])
  
  // Save sidebar preference
  useEffect(() => {
    if (useSidebar) {
      localStorage.setItem('sidebarCollapsed', isCollapsed.toString())
    }
  }, [isCollapsed, useSidebar])
  
  if (!useSidebar) {
    // Return the original tabs layout
    return (
      <>
        <TabsList className="bg-gray-50 border border-gray-200 p-1 rounded-lg grid w-full grid-cols-7">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
          >
            <Gauge className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          
          <TabsTrigger 
            value="upload"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          
          <TabsTrigger 
            value="resumes"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all relative"
          >
            <FileText className="h-4 w-4 mr-2" />
            My Resumes
            {resumes.length > 0 && (
              <span className="ml-2 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded-full">{resumes.length}</span>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="search"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </TabsTrigger>
          
          <TabsTrigger 
            value="templates"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
          >
            <Layers className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          
          <TabsTrigger 
            value="coverletters"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
          >
            <PenTool className="h-4 w-4 mr-2" />
            Cover Letters
          </TabsTrigger>
          
          <TabsTrigger 
            value="favorites"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all"
          >
            <Star className="h-4 w-4 mr-2" />
            Favorites
          </TabsTrigger>
        </TabsList>
        {children}
      </>
    )
  }
  
  // Sidebar layout
  return (
    <div className="flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          resumes={resumes}
          user={user}
          profile={profile}
          notifications={notifications}
          unreadCount={unreadCount}
          onLogout={onLogout}
        />
      </div>
      
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed left-0 top-0 h-full z-40">
            <DashboardSidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab)
                setIsMobileMenuOpen(false)
              }}
              isCollapsed={false}
              setIsCollapsed={() => {}}
              resumes={resumes}
              user={user}
              profile={profile}
              notifications={notifications}
              unreadCount={unreadCount}
              onLogout={onLogout}
            />
          </div>
        </>
      )}
      
      {/* Main Content */}
      <div className={`flex-1 ${useSidebar ? (isCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''} transition-all duration-300`}>
        {children}
      </div>
    </div>
  )
}