import { auth0 } from '@/lib/auth0'
import { NextResponse } from 'next/server'

/**
 * Returns the Auth0 session if the current user is an admin, otherwise null.
 * Admins are defined by the ADMIN_EMAILS env var (comma-separated list).
 *
 * Usage in API routes:
 *   const session = await requireAdmin()
 *   if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 */
export async function requireAdmin() {
  const session = await auth0.getSession()
  if (!session) return null

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  const userEmail = (session.user.email ?? '').toLowerCase()

  if (!adminEmails.includes(userEmail)) return null
  return session
}

/**
 * Returns true if the current user is an admin.
 * Use this in Server Components / layouts for redirect guards.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await requireAdmin()
  return session !== null
}
