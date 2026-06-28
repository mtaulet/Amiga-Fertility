import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('clinic_providers')
    .select('id, auth0_id, email, created_at')
    .eq('clinic_id', id)
    .order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ providers: data ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { auth0_id } = await request.json()
  if (!auth0_id?.trim()) return NextResponse.json({ error: 'auth0_id is required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('clinic_providers')
    .insert({ clinic_id: id, auth0_id: auth0_id.trim() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ provider: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { auth0_id } = await request.json()
  const { error } = await supabaseAdmin
    .from('clinic_providers')
    .delete()
    .eq('clinic_id', id)
    .eq('auth0_id', auth0_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
