"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DebugAuth() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        console.log('Environment variables:')
        console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
        console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING')

        const supabase = createClient()
        console.log('Supabase client created')

        // Try to get session
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Session check:', { session: !!session, error })

        if (error) {
          setStatus(`Auth Error: ${error.message}`)
        } else {
          setStatus(`Auth OK - User: ${session ? 'Logged in' : 'Not logged in'}`)
        }
      } catch (err) {
        console.error('Debug error:', err)
        setStatus(`Debug Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    checkSupabase()
  }, [])

  return (
    <div className="fixed top-0 right-0 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4 text-sm z-50">
      <strong>Debug:</strong> {status}
    </div>
  )
}