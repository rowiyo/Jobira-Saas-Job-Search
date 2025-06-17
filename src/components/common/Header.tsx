'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface HeaderProps {
  user?: any
  showAuthButton?: boolean
}

export function Header({ user, showAuthButton = true }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const handleLogin = () => {
    router.push('/auth')
  }

  const handleHome = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  }

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Logo/Brand - clickable to go home */}
          <div 
            onClick={handleHome}
            className="cursor-pointer"
          >
            <h1 className="text-3xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              PandaVista
            </h1>
            <p className="text-sm text-gray-500 hidden sm:block">
              AI-powered job search across all major job boards
            </p>
          </div>

          {/* User section */}
          {showAuthButton && (
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700">
                    Welcome, {user.user_metadata?.first_name || user.email.split('@')[0]}!
                  </span>
                  <Button onClick={handleLogout} variant="destructive">
                    Logout
                  </Button>
                </>
              ) : (
                <Button onClick={handleLogin} variant="default">
                  Sign In
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}