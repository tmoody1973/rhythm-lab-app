"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/supabase/client'

export function DebugAuthTest() {
  const [status, setStatus] = useState('')
  const supabase = createClient()

  const testDirectAuth = async () => {
    setStatus('Testing direct auth...')

    try {
      // Try to get current user
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        setStatus(`Auth Error: ${error.message}`)
        return
      }

      if (user) {
        setStatus(`✅ Already logged in as: ${user.email}`)
      } else {
        setStatus('❌ Not logged in')
      }

      // Also test profile access
      if (user) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          setStatus(prev => prev + `\n📋 Profile Error: ${profileError.message}`)
        } else {
          setStatus(prev => prev + `\n📋 Profile: ${profiles ? 'Found' : 'Not found'}`)
        }
      }

    } catch (error) {
      setStatus(`Unexpected error: ${error}`)
    }
  }

  const testSignUp = async () => {
    setStatus('Testing signup...')
    const testEmail = `test-${Date.now()}@example.com`

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123'
    })

    if (error) {
      setStatus(`Signup Error: ${error.message}`)
    } else {
      setStatus(`Signup Success: ${data.user?.email} (confirmation_sent_at: ${data.user?.confirmation_sent_at})`)
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-100 border border-gray-300 p-4 rounded-lg max-w-sm z-50">
      <h4 className="font-bold text-sm mb-2">🔧 Auth Debug</h4>
      <div className="space-y-2">
        <Button size="sm" onClick={testDirectAuth} className="w-full">
          Test Auth Status
        </Button>
        <Button size="sm" onClick={testSignUp} className="w-full">
          Test Signup
        </Button>
        {status && (
          <div className="text-xs bg-white p-2 rounded border whitespace-pre-wrap">
            {status}
          </div>
        )}
      </div>
    </div>
  )
}