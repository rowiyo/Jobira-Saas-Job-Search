'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AuthenticationPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Logged in successfully!')
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
        }
      }
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Account created! Check your email to confirm.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header matching dashboard style */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <img 
                src="/jobira_logo_sm.png" 
                alt="Jobira" 
                className="h-10 w-auto"
              />
            </Link>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Jobira
            </h1>
            <p className="text-gray-600">
              AI-powered job search across all major job boards
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-center mb-6">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </h2>

            {message && (
              <div className={`p-3 rounded mb-4 ${message.includes('Error') 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}