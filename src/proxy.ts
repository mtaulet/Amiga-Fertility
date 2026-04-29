import { auth0 } from './lib/auth0'
import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_ROUTES = ['/intake', '/dashboard', '/profile', '/appointments', '/clinics']

export async function proxy(request: Request) {
  const authResponse = await auth0.middleware(request)

  const { pathname } = new URL(request.url)
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    const nextRequest = new NextRequest(request)
    const session = await auth0.getSession(nextRequest)
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return authResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
