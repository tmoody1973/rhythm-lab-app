import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Server-side auth helper with timeout
export async function getServerSession(timeoutMs: number = 5000) {
  try {
    const client = await createClient()

    const sessionPromise = client.auth.getSession()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session fetch timeout')), timeoutMs)
    )

    const result = await Promise.race([sessionPromise, timeoutPromise])
    const { data, error } = result as any

    if (error) {
      console.error('Server session error:', error)
      return { session: null, error }
    }

    return { session: data.session, error: null }
  } catch (error) {
    console.error('Server session timeout:', error)
    return { session: null, error }
  }
}