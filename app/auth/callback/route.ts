import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data.user) {
        console.log('Email confirmed for user:', data.user.id)

        // Create profile after email confirmation using the safe function
        const { error: profileError } = await supabase
          .rpc('create_profile_if_not_exists', {
            user_id: data.user.id,
            user_email: data.user.email!,
            user_username: data.user.email!.split('@')[0],
            user_full_name: data.user.user_metadata?.full_name,
            user_avatar_url: data.user.user_metadata?.avatar_url,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        } else {
          console.log('Profile created successfully for user:', data.user.id)
        }

        // Redirect to success page or dashboard
        return NextResponse.redirect(new URL(`${next}?confirmed=true`, request.url))
      }
    } catch (error) {
      console.error('Auth callback error:', error)
    }
  }

  // Redirect to error page or login with error
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}