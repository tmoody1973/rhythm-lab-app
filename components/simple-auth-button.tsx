"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AuthModal } from './auth/auth-modal'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function SimpleAuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    )
  }

  if (!user) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          className="text-sm"
        >
          Sign In
        </Button>
        <AuthModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href="/profile"
        className="text-sm text-gray-700 hover:text-gray-900"
      >
        Profile
      </a>
      <Button
        variant="ghost"
        size="sm"
        onClick={signOut}
        className="text-sm"
      >
        Sign Out
      </Button>
    </div>
  )
}