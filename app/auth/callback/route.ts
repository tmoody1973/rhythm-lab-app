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

        // Create profile after email confirmation
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            username: data.user.email!.split('@')[0], // Default username from email
            full_name: data.user.user_metadata?.full_name,
            avatar_url: data.user.user_metadata?.avatar_url,
            role: 'user',
          })
          .select()
          .single()

        if (profileError && profileError.code !== '23505') {
          // 23505 is duplicate key error - profile already exists
          console.error('Profile creation error:', profileError)
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