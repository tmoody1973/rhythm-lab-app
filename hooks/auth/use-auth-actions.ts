"use client"

import { useState } from 'react'
import { createClient, withTimeout, clientTimeouts } from '@/lib/supabase/client'
import type { AuthError } from '@supabase/supabase-js'

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, username?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  loading: boolean
}

export function useAuthActions(): AuthActions {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        clientTimeouts.auth,
        'Sign in timeout'
      )
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username?: string) => {
    setLoading(true)
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        }),
        clientTimeouts.auth,
        'Sign up timeout'
      )

      // Note: Profile creation will happen after email confirmation in the callback route
      // The user object exists but is not confirmed until they click the email link

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      // Simple sign out with timeout - don't wait for Supabase response
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      )

      await Promise.race([signOutPromise, timeoutPromise])
    } catch (error) {
      console.log('Sign out timeout (continuing):', error)
      // Continue anyway - local state will be cleared by auth state change
    } finally {
      setLoading(false)
    }
  }

  return {
    signIn,
    signUp,
    signOut,
    loading,
  }
}