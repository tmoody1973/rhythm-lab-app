"use client"

import { useState, useEffect } from 'react'
import type { Session, User, AuthError } from '@supabase/supabase-js'
import { createClient, withTimeout, clientTimeouts } from '@/lib/supabase/client'

interface AuthSessionState {
  session: Session | null
  user: User | null
  loading: boolean
  error: AuthError | null
}

export function useAuthSession() {
  const [state, setState] = useState<AuthSessionState>({
    session: null,
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    // Initialize session
    const initializeSession = async () => {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          clientTimeouts.auth,
          'Session initialization timeout'
        )

        if (mounted) {
          if (error) {
            setState(prev => ({ ...prev, loading: false, error }))
          } else {
            setState(prev => ({
              ...prev,
              session: data.session,
              user: data.session?.user || null,
              loading: false,
              error: null,
            }))
          }
        }
      } catch (error) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error as AuthError,
          }))
        }
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setState(prev => ({
            ...prev,
            session,
            user: session?.user || null,
            loading: false,
            error: null,
          }))
        }
      }
    )

    initializeSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}