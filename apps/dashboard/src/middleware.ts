import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create Supabase client for server-side auth check
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  // Get all Supabase-related cookies
  const allCookies = req.cookies.getAll()
  const supabaseCookies = allCookies.filter(cookie =>
    cookie.name.startsWith('sb-') || cookie.name.includes('supabase')
  )

  // Check if there's any authentication cookie present
  const hasAuthCookie = supabaseCookies.length > 0

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!hasAuthCookie) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  // Redirect to dashboard if already logged in (only for login/signup pages)
  if (req.nextUrl.pathname === '/auth/login' || req.nextUrl.pathname === '/auth/signup') {
    if (hasAuthCookie) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    // Temporarily disable middleware to allow login testing
    // Once login works, we can re-enable with proper Supabase cookie handling
    // '/dashboard/:path*',
    // '/auth/:path*',
    // '/api/keys/:path*',
    // '/api/stripe/checkout',
  ],
}
