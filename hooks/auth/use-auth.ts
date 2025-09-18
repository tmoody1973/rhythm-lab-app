"use client"

import { useAuthSession } from './use-auth-session'
import { useUserProfile } from './use-user-profile'
import { useAuthActions } from './use-auth-actions'

export function useAuth() {
  const { session, user, loading: sessionLoading, error: sessionError } = useAuthSession()
  const { profile, loading: profileLoading, error: profileError, refreshProfile } = useUserProfile(user)
  const { loading: actionsLoading, ...authActions } = useAuthActions()

  // Combined loading state - true if either session, profile, or actions are loading
  const loading = sessionLoading || (user && profileLoading) || actionsLoading

  // Combined error state
  const error = sessionError || (profileError ? new Error(profileError) : null)

  return {
    // Auth state
    user,
    profile,
    session,
    loading,
    error,

    // Actions
    ...authActions,
    refreshProfile,

    // Helper computed values
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
  }
}