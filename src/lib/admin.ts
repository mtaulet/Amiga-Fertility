import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'
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

export async function requireProvider() {
  const session = await auth0.getSession()
  if (!session) return null
  const { data } = await supabaseAdmin
    .from('clinic_providers')
    .select('id')
    .eq('auth0_id', session.user.sub)
    .limit(1)
    .single()
  if (!data) return null
  return session
}

export async function isProvider(): Promise<boolean> {
  return (await requireProvider()) !== null
}

export async function getProviderClinic() {
  const session = await requireProvider()
  if (!session) return null
  const { data: row } = await supabaseAdmin
    .from('clinic_providers')
    .select('clinic:clinics(*)')
    .eq('auth0_id', session.user.sub)
    .limit(1)
    .single()
  return { session, clinic: (row?.clinic as any) ?? null }
}
