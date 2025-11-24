import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Get all cookies
  const allCookies = req.cookies.getAll()

  // Check for Supabase auth cookies - more lenient check
  // Supabase stores cookies with project-specific names like: sb-{project-ref}-auth-token
  const hasAuthCookie = allCookies.some(cookie => {
    const name = cookie.name.toLowerCase()
    return (
      name.includes('sb-') && name.includes('auth-token') ||
      name === 'supabase-auth-token' ||
      name.includes('supabase') && cookie.value.length > 0
    )
  })

  // For debugging - remove in production
  console.log('Middleware check:', {
    path: req.nextUrl.pathname,
    hasAuthCookie,
    cookieCount: allCookies.length,
    cookieNames: allCookies.map(c => c.name)
  })

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!hasAuthCookie) {
      console.log('No auth cookie, redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
    console.log('Auth cookie found, allowing access to dashboard')
  }

  // Redirect to dashboard if already logged in (only for login/signup pages)
  if (req.nextUrl.pathname === '/auth/login' || req.nextUrl.pathname === '/auth/signup') {
    if (hasAuthCookie) {
      console.log('Already authenticated, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    // Temporarily disable middleware to allow testing
    // '/dashboard/:path*',
    // '/auth/:path*',
    '/api/keys/:path*',
    '/api/stripe/checkout',
  ],
}
