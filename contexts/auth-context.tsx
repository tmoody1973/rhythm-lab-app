"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/database/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for userId:', userId)

      // Add timeout to profile fetch
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

      if (error) {
        console.error('Error fetching profile:', error)
        if (error.code === 'PGRST116') {
          // No profile found - this is expected for new users
          console.log('No profile found for user, will be created after email confirmation')
          setProfile(null)
          return
        }
        // Other errors
        setProfile(null)
        return
      }

      console.log('Profile fetched successfully:', data)
      setProfile(data || null)
    } catch (error) {
      console.error('Profile fetch timeout or error:', error)
      setProfile(null)
    }
  }

  const createProfile = async (user: User, username?: string) => {
    try {
      // First check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        console.log('Profile already exists, fetching it...')
        await fetchProfile(user.id)
        return
      }

      // Use the safe profile creation function
      const { error } = await supabase
        .rpc('create_profile_if_not_exists', {
          user_id: user.id,
          user_email: user.email!,
          user_username: username,
          user_full_name: user.user_metadata?.full_name,
          user_avatar_url: user.user_metadata?.avatar_url,
        })

      if (error) {
        console.error('Error creating profile:', error)
        return
      }

      await fetchProfile(user.id)
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, username?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    // Note: Profile creation will happen after email confirmation
    // The user object exists but is not confirmed until they click the email link

    return { error }
  }

  const signOut = async () => {
    try {
      console.log('Signing out...')

      // Clear local state first to provide immediate feedback
      setUser(null)
      setProfile(null)
      setSession(null)

      // Add timeout to prevent hanging, but don't await it
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timeout')), 2000)
      )

      try {
        await Promise.race([signOutPromise, timeoutPromise])
        console.log('Successfully signed out')
      } catch (timeoutError) {
        console.warn('Sign out timeout (local state cleared):', timeoutError)
        // Continue - local state is already cleared
      }
    } catch (error) {
      console.warn('Sign out error (local state cleared):', error)
      // Local state is already cleared, so user appears signed out
    }
  }

  useEffect(() => {
    let mounted = true

    // Set loading timeout as fallback
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - setting loading to false')
        setLoading(false)
      }
    }, 3000) // 3 second timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial user...')

        // Add timeout to auth check
        const authPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        )

        const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]) as any

        if (error) {
          console.warn('Auth error (likely invalid session):', error.message)
          // Clear auth state and continue
          if (mounted) {
            setUser(null)
            setProfile(null)
            setSession(null)
            setLoading(false)
          }
          return
        }

        console.log('Initial user:', !!user)

        if (mounted) {
          setUser(user)

          if (user) {
            console.log('Fetching profile for user:', user.id)
            await fetchProfile(user.id)
          } else {
            console.log('No user, setting profile to null')
            setProfile(null)
          }

          setLoading(false)
          console.log('Auth initialization complete')
        }
      } catch (error) {
        console.warn('Auth initialization timeout (continuing without auth):', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setSession(null)
          setLoading(false)
        }
      }
    }

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session)

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }

          setLoading(false)
        }
      }
    )

    // Get initial session
    getInitialSession()

    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}