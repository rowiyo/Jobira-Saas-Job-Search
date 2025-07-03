// components/dashboard/DashboardSidebar.tsx
import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Gauge, Upload, FileText, Search, Layers, 
  PenTool, Star, ChevronLeft, ChevronRight,
  User, Settings, LogOut, Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  resumes: any[]
  user: any
  profile: any
  notifications: any[]
  unreadCount: number
  onLogout: () => void
}

export const DashboardSidebar = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  resumes,
  user,
  profile,
  notifications,
  unreadCount,
  onLogout
}: DashboardSidebarProps) => {
  const router = useRouter()
  
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Gauge },
    { id: 'upload', label: 'Upload Resume', icon: Upload },
    { 
      id: 'resumes', 
      label: 'My Resumes', 
      icon: FileText,
      badge: resumes.length > 0 ? resumes.length : null
    },
    { id: 'search', label: 'Job Search', icon: Search },
    { id: 'templates', label: 'Resume Templates', icon: Layers },
    { id: 'coverletters', label: 'Cover Letters', icon: PenTool },
    { id: 'favorites', label: 'Favorites', icon: Star },
  ]

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-gray-900 text-white transition-all duration-300 z-40 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {!isCollapsed && (
            <img 
              src="/jobira_logo_sm.png" 
              alt="Jobira" 
              className="h-8 w-auto"
            />
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
  if (item.id === 'coverletters') {
    router.push('/dashboard/cover-letters')
  } else {
    setActiveTab(item.id)
  }
}}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                    }`}
                  >
                    <Icon 
                      size={20} 
                      className={`${isCollapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0`}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-gray-700 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {item.label}
                        {item.badge && ` (${item.badge})`}
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-800 p-4">
          {!isCollapsed ? (
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard/account')}
                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate text-white">
                    {user?.user_metadata?.first_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <Settings className="h-4 w-4 text-gray-400" />
              </button>
              <Button
                onClick={onLogout}
                size="sm"
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            /* Collapsed state */
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard/account')}
                className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-800 transition-colors group relative"
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-300" />
                  </div>
                )}
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Account Settings
                </div>
              </button>
              <Button
                onClick={onLogout}
                size="icon"
                variant="ghost"
                className="w-full justify-center text-gray-300 hover:text-white hover:bg-gray-800 group relative"
              >
                <LogOut className="h-4 w-4" />
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Logout
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}