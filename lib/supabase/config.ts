import type { SupabaseClientOptions } from '@supabase/supabase-js'

// Supabase client configuration with optimized settings
export const supabaseConfig: SupabaseClientOptions<'public'> = {
  // Connection settings
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
  },
  global: {
    headers: {
      'X-Client-Info': 'rhythm-lab-web',
    },
  },
  // Network optimization
  realtime: {
    params: {
      eventsPerSecond: 5,
    },
  },
}

// Client-specific timeouts
export const clientTimeouts = {
  auth: 10000, // 10 seconds for auth operations
  profile: 8000, // 8 seconds for profile fetching
  default: 5000, // 5 seconds for general operations
}

// Retry configuration
export const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
}