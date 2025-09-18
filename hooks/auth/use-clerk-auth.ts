"use client"

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  username?: string
  email: string
  role: 'user' | 'admin' | 'super_admin'
  created_at?: string
  updated_at?: string
}

// Add your admin email here for testing
const ADMIN_EMAIL_FALLBACKS = [
  'admin@example.com',
  // Add any test emails here temporarily
]

const isAdminEmail = (email: string | undefined | null) => {
  if (!email) return false
  const normalized = email.toLowerCase()

  // TEMPORARY: For development, log the email being checked
  console.log('[Auth Debug] Checking admin access for email:', normalized)

  return normalized.endsWith('@rhythmlabradio.com') || ADMIN_EMAIL_FALLBACKS.includes(normalized)
}

const resolveUserRole = (clerkUser: any, fallbackRole: UserProfile['role'] = 'user'): UserProfile['role'] => {
  const metadataRole = (clerkUser?.publicMetadata?.role || clerkUser?.privateMetadata?.role) as string | undefined

  if (metadataRole === 'admin' || metadataRole === 'super_admin') {
    return metadataRole
  }

  if (isAdminEmail(clerkUser?.emailAddresses?.[0]?.emailAddress)) {
    return 'admin'
  }

  return fallbackRole
}

export function useAuth() {
  const { user, isLoaded: userLoaded } = useUser()
  const { signOut: clerkSignOut } = useClerkAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUserProfile = async (clerkUser: any): Promise<UserProfile | null> => {
    if (!clerkUser) return null

    const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress
    if (!primaryEmail) {
      return {
        id: clerkUser.id,
        email: '',
        username: clerkUser.username || clerkUser.firstName || '',
        role: resolveUserRole(clerkUser),
      }
    }

    try {
      const supabase = createClient()

      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', primaryEmail)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingProfile) {
        const role = resolveUserRole(clerkUser, (existingProfile.role as UserProfile['role']) || 'user')
        return {
          ...existingProfile,
          role,
        }
      }

      return {
        id: clerkUser.id,
        email: primaryEmail,
        username: clerkUser.username || clerkUser.firstName || primaryEmail.split('@')[0],
        role: resolveUserRole(clerkUser),
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      throw err
    }
  }

  useEffect(() => {
    if (!userLoaded) return

    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      setError(null)
      return
    }

    setProfileLoading(true)

    fetchUserProfile(user)
      .then(profile => {
        setProfile(profile)
        setError(null)
      })
      .catch(err => {
        setError(err as Error)
        setProfile(null)
      })
      .finally(() => {
        setProfileLoading(false)
      })
  }, [user, userLoaded])

  const refreshProfile = async () => {
    if (!user) return

    setProfileLoading(true)
    try {
      const updatedProfile = await fetchUserProfile(user)
      setProfile(updatedProfile)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setProfileLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await clerkSignOut()
      setProfile(null)
      setError(null)
    } catch (err) {
      setError(err as Error)
    }
  }

  const computedRole = useMemo(() => {
    if (profile?.role) {
      return profile.role
    }

    return resolveUserRole(user)
  }, [profile?.role, user])

  const isAuthenticated = !!user && userLoaded
  const isAdmin = computedRole === 'admin' || computedRole === 'super_admin'
  const loading = !userLoaded || profileLoading

  return {
    user,
    profile: profile ? { ...profile, role: computedRole } : profile,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    signOut,
    refreshProfile,
  }
}
