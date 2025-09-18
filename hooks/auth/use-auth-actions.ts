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
        supabase.auth.signUp({ email, password }),
        clientTimeouts.auth,
        'Sign up timeout'
      )

      if (!error && data.user && username) {
        // Create profile with username
        try {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email!,
            username,
            role: 'user',
          })
        } catch (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't fail signup if profile creation fails
        }
      }

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
      console.warn('Sign out warning (continuing):', error)
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