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
      return NextResponse.json({ appointment: null })
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ appointment: null })
      throw error
    }

    // Fetch clinic name separately to avoid join issues
    let clinicName: string | null = null
    if (appointment.clinic_id) {
      const { data: clinic } = await supabaseAdmin
        .from('clinics')
        .select('name')
        .eq('id', appointment.clinic_id)
        .single()
      clinicName = clinic?.name ?? null
    }

    return NextResponse.json({ appointment: { ...appointment, clinic_name: clinicName } })
  } catch (error: any) {
    console.error('Failed to fetch latest appointment:', error)
    return NextResponse.json({ error: error.message ?? 'Failed to fetch appointment' }, { status: 500 })
  }
}
