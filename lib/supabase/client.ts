import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig, clientTimeouts } from './config'

// Re-export for external use
export { clientTimeouts } from './config'

// Singleton client instance for browser
let client: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  // Return existing client if available
  if (client) {
    return client
  }

  // Create new optimized client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseConfig
  )

  return client
}

// Helper function with timeout wrapper
export async function withTimeout<T>(
  operation: Promise<T>,
  timeout: number = clientTimeouts.default,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeout)
  })

  return Promise.race([operation, timeoutPromise])
}

// Optimized profile fetcher with retry logic
export async function fetchProfileWithRetry(
  userId: string,
  maxRetries: number = 3
): Promise<any> {
  const client = createClient()
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const profileQuery = client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const result = await withTimeout(
        profileQuery,
        clientTimeouts.profile,
        `Profile fetch timeout (attempt ${attempt})`
      )

      const { data, error } = result as any

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Profile fetch error: ${error.message}`)
      }

      return { data, error }
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
    }
  }

  throw lastError || new Error('Profile fetch failed after all retries')
}