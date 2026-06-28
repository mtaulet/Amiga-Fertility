import { NextRequest, NextResponse } from 'next/server'
import { getProviderClinic } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const ctx = await getProviderClinic()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ clinic: ctx.clinic })
}

export async function PATCH(request: NextRequest) {
  const ctx = await getProviderClinic()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!ctx.clinic) return NextResponse.json({ error: 'No clinic linked to this account' }, { status: 404 })

  const body = await request.json()
  const allowed = ['name', 'description', 'locations', 'expertise', 'price_range', 'years_experience', 'size']
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('clinics')
    .update(updates)
    .eq('id', ctx.clinic.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clinic: data })
}
