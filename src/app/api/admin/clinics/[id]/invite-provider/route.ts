import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createProviderUser, assignProviderRole } from '@/lib/auth0-mgmt'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: clinicId } = await params
  const { email, password } = await request.json()

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  // Verify clinic exists
  const { data: clinic } = await supabaseAdmin
    .from('clinics')
    .select('id, name')
    .eq('id', clinicId)
    .single()

  if (!clinic) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })

  try {
    const user = await createProviderUser(email.trim(), password)
    await assignProviderRole(user.user_id)
    await supabaseAdmin
      .from('clinic_providers')
      .insert({ clinic_id: clinicId, auth0_id: user.user_id, email: email.trim() })
    return NextResponse.json({ ok: true, auth0_id: user.user_id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to create provider' }, { status: 500 })
  }
}
