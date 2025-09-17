"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useAuth } from '@/lib/auth/context'
import { AuthModal } from './auth-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Heart } from 'lucide-react'

export function AuthButton() {
  const { user, profile, signOut, loading } = useAuth()
  const [showModal, setShowModal] = useState(false)

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <User size={16} />
          {profile?.username || profile?.email?.split('@')[0] || 'Profile'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href="/profile" className="flex items-center gap-2">
            <Heart size={16} />
            My Favorites
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} className="flex items-center gap-2">
          <LogOut size={16} />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}