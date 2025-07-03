'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Trash2, 
  Save, 
  Camera,
  ArrowLeft,
  Shield,
  Palette,
  AlertTriangle,
  CheckCircle,
  Home,
  BarChart,
  ChevronRight,
  ChevronDown,
  Settings,
  LogOut
} from 'lucide-react'

const supabase = createClient()

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  email_notifications: boolean
  theme: 'light' | 'dark' | 'system'
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [user, setUser] = useState<any>(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      setUser(session.user)

      // Get user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      // If no profile exists, create one
      if (!profileData) {
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            email_notifications: true,
            theme: 'system'
          })
          .select()
          .single()

        setProfile({
          ...newProfile,
          email: session.user.email || ''
        })
      } else {
        setProfile({
          ...profileData,
          email: session.user.email || profileData.email
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!profile) return
    
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email_notifications: profile.email_notifications,
          theme: profile.theme
        })
        .eq('id', profile.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${profile.id}/${oldPath}`])
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${profile.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', profile.id)
        .select()

      if (updateError) throw updateError

      // Update local state
      setProfile({ ...profile, avatar_url: urlData.publicUrl })
      setMessage({ type: 'success', text: 'Profile picture updated!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to upload image: ${error.message}` })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return

    try {
      // In production, you'd want to:
      // 1. Delete user's data from your database
      // 2. Cancel any subscriptions
      // 3. Delete the auth user
      
      // For now, we'll just show a message
      setMessage({ type: 'success', text: 'Account deletion requested. Please contact support to complete the process.' })
      setShowDeleteDialog(false)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading account settings...</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-white">
      {/* Header - matching Dashboard style */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <img 
                src="/jobira_logo_sm.png" 
                alt="Jobira" 
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center space-x-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <span className="text-gray-900 text-sm font-medium">
                      {user?.user_metadata?.first_name || user?.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white">
                  <DropdownMenuItem 
                    onClick={() => router.push('/dashboard')}
                    className="cursor-pointer"
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Link href="/dashboard" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
            <BarChart className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="flex items-center gap-1 text-gray-900">
            <Settings className="h-3.5 w-3.5" />
            <span>Account Settings</span>
          </span>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account preferences and security settings</p>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-gray-50 border border-gray-200 p-1 rounded-lg grid w-full grid-cols-4">
              <TabsTrigger 
                value="profile" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="preferences" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger 
                value="danger" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 rounded-md transition-all flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Profile Information</CardTitle>
                  <CardDescription className="text-gray-600">Update your personal information and profile picture</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', profile.avatar_url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <User className="h-10 w-10 text-gray-400" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <Camera className="h-4 w-4 text-gray-600" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Profile Picture</p>
                      <p className="text-sm text-gray-600">Click to upload a new photo (max 2MB)</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-50 border-gray-300"
                      />
                    </div>
                    <p className="text-sm text-gray-500">Your email cannot be changed</p>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.first_name || ''}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        placeholder="John"
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.last_name || ''}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        placeholder="Doe"
                        className="border-gray-300"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Password & Security</CardTitle>
                  <CardDescription className="text-gray-600">Manage your password and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-gray-700">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-gray-700">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handlePasswordChange} 
                    disabled={saving || !passwordData.newPassword}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Preferences</CardTitle>
                  <CardDescription className="text-gray-600">Customize your experience and notification settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-gray-400" />
                        <Label htmlFor="emailNotifications" className="text-gray-900">Email Notifications</Label>
                      </div>
                      <p className="text-sm text-gray-600">Receive updates about your job searches and new features</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={profile.email_notifications}
                      onCheckedChange={(checked) => setProfile({ ...profile, email_notifications: checked })}
                    />
                  </div>

                  {/* Theme */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-gray-400" />
                      <Label className="text-gray-900">Theme Preference</Label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(['light', 'dark', 'system'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setProfile({ ...profile, theme })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            profile.theme === theme
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <p className="text-sm font-medium capitalize">{theme}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Danger Zone Tab */}
            <TabsContent value="danger">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-900">Danger Zone</CardTitle>
                  <CardDescription className="text-red-700">
                    Irreversible actions that affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        Deleting your account will permanently remove all your data including resumes, 
                        job searches, and saved preferences. This action cannot be undone.
                      </AlertDescription>
                    </Alert>
                    
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="deleteConfirm" className="text-sm text-gray-600">
              Type DELETE to confirm
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className="mt-2 border-gray-300"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE'}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}