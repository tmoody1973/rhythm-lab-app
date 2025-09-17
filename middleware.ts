import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if trying to access admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // If no session, redirect to admin login
    if (!session) {
      const redirectUrl = new URL('/admin/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check user role from profile
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (error || !profile) {
        console.error('Error fetching user profile:', error)
        const redirectUrl = new URL('/admin/login', request.url)
        redirectUrl.searchParams.set('error', 'unauthorized')
        return NextResponse.redirect(redirectUrl)
      }

      // Check if user has admin or super_admin role
      if (profile.role !== 'admin' && profile.role !== 'super_admin') {
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('error', 'access_denied')
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Middleware error:', error)
      const redirectUrl = new URL('/admin/login', request.url)
      redirectUrl.searchParams.set('error', 'server_error')
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}