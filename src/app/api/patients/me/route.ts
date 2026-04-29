import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    const session = await auth0.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('first_name, last_name, preferred_name, date_of_birth, sex, email, phone_number, timezone, fertility_goals, treatment_type, treatment_timeline, partner_name, partner_last_name, partner_email, partner_phone')
      .eq('auth0_id', session.user.sub)
      .single()

    return NextResponse.json({ patient: patient ?? null })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Strip fields that shouldn't be updated via this route
    const { id, auth0_id, created_at, intake_completed, intake_completed_at, terms_accepted, terms_accepted_at, ...allowed } = body

    const { data, error } = await supabaseAdmin
      .from('patients')
      .update({ ...allowed, updated_at: new Date().toISOString() })
      .eq('auth0_id', session.user.sub)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ patient: data })
  } catch (error: any) {
    console.error('Patient update error:', error)
    const message = process.env.NODE_ENV === 'development' ? (error.message ?? 'Update failed') : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
