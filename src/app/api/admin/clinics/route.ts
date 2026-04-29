import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/admin/clinics
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('clinics')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Admin clinics fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch clinics' }, { status: 500 })
  }

  return NextResponse.json({ clinics: data ?? [] })
}

// POST /api/admin/clinics — onboard a new clinic
export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const {
      name, locations, years_experience, size, expertise,
      description, price_range,
      website, contact_name, contact_email, contact_phone,
      internal_notes, status,
    } = body

    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .insert({
        name,
        locations: locations ?? [],
        years_experience: years_experience ?? 0,
        size: size ?? null,
        expertise: expertise ?? [],
        description: description ?? null,
        price_range: price_range ?? null,
        website: website ?? null,
        contact_name: contact_name ?? null,
        contact_email: contact_email ?? null,
        contact_phone: contact_phone ?? null,
        internal_notes: internal_notes ?? null,
        status: status ?? 'active',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ clinic }, { status: 201 })
  } catch (error: any) {
    console.error('Admin create clinic error:', error)
    return NextResponse.json({ error: error.message ?? 'Failed to create clinic' }, { status: 500 })
  }
}
