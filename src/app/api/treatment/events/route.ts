import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    const session = await auth0.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('auth0_id', session.user.sub)
      .single()

    if (!patient) return NextResponse.json({ events: [], generatedAt: null })

    const { data: events } = await supabaseAdmin
      .from('treatment_events')
      .select('*')
      .eq('patient_id', patient.id)
      .order('date')
      .order('sort_order')

    // Get generated_at from latest appointment
    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('treatment_generated_at')
      .eq('patient_id', patient.id)
      .not('treatment_generated_at', 'is', null)
      .order('treatment_generated_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      events: events ?? [],
      generatedAt: appointment?.treatment_generated_at ?? null,
    })
  } catch (error: any) {
    console.error('Treatment events fetch error:', error)
    return NextResponse.json({ events: [], generatedAt: null })
  }
}
