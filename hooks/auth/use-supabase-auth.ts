"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  username?: string
  email: string
  role: 'user' | 'admin' | 'super_admin'
  created_at?: string
  updated_at?: string
}

// Add admin emails for testing
const ADMIN_EMAILS = [
  'admin@rhythmlabradio.com',
  // Add your test email here for development
]

// Helper to check admin status
const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false
  const normalizedEmail = email.toLowerCase()
  return ADMIN_EMAILS.includes(normalizedEmail) || normalizedEmail.endsWith('@rhythmlabradio.com')
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) throw error

        setUser(user)

        if (user) {
          await fetchUserProfile(user)
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (user: User) => {
    try {
      console.log('[Auth] Fetching profile for user:', user.id, user.email)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Profile fetch error:', error)
        throw error
      }

      console.log('[Auth] Profile data from DB:', data)

      // Determine if user is admin
      const emailIsAdmin = isAdminEmail(user.email)
      const role = data?.role || (emailIsAdmin ? 'admin' : 'user')

      console.log('[Auth] Computed role:', role, 'isAdminEmail:', emailIsAdmin)

      const profileData: UserProfile = {
        id: user.id,
        email: user.email || '',
        username: data?.username || user.email?.split('@')[0] || '',
        role,
        created_at: data?.created_at,
        updated_at: data?.updated_at
      }

      setProfile(profileData)
      console.log('[Auth] Profile set:', profileData)
    } catch (err) {
      console.error('[Auth] Error fetching profile:', err)
      setError(err as Error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Sign in error:', err)
      return { data: null, error: err as Error }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Sign up error:', err)
      return { data: null, error: err as Error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      router.push('/admin/login')
    } catch (err) {
      console.error('Sign out error:', err)
      setError(err as Error)
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    await fetchUserProfile(user)
  }

  const isAuthenticated = !!user
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }
}