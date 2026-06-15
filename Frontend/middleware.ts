import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if we're accessing a protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/admin')
  if (isProtectedRoute) {
    // Get the HttpOnly cookie set by the FastAPI backend
    const token = request.cookies.get('access_token')

    // If there is no token, redirect to the login page
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      // Save the URL they tried to access so we can redirect back later (optional)
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If token exists or route isn't protected, let the request proceed
  return NextResponse.next()
}

export const config = {
  // Apply middleware to all admin and protected routes
  matcher: ['/admin/:path*'],
}
