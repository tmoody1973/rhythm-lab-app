"use client"

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { fetchProfileWithRetry } from '@/lib/supabase/client'
import type { Profile } from '@/lib/database/types'

interface ProfileState {
  profile: Profile | null
  loading: boolean
  error: string | null
}

export function useUserProfile(user: User | null) {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: false,
    error: null,
  })

  const fetchProfile = async (userId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await fetchProfileWithRetry(userId)

      if (error && error.code !== 'PGRST116') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: `Failed to fetch profile: ${error.message}`,
        }))
        return
      }

      setState(prev => ({
        ...prev,
        profile: data || null,
        loading: false,
        error: null,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown profile error',
      }))
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id)
    } else {
      setState({ profile: null, loading: false, error: null })
    }
  }, [user?.id])

  return {
    ...state,
    refreshProfile,
  }
}