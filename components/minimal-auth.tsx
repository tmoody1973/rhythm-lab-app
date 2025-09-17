"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { AuthModal } from './auth/auth-modal'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

export function MinimalAuth() {
  const [showModal, setShowModal] = useState(false)
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="text-xs">
            {user.email}
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
        >
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
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