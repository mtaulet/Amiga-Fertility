import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('auth0_id', session.user.sub)
      .single()

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select('*, clinics(name)')
      .eq('patient_id', patient.id)
      .order('appointment_date', { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    // Flatten clinic name from join
    let result = null
    if (appointment) {
      const { clinics, ...rest } = appointment as any
      result = { ...rest, clinic_name: clinics?.name ?? null }
    }

    return NextResponse.json({ appointment: result })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}
