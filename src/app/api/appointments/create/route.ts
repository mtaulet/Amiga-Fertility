import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { doctor_name, appointment_type, appointment_date, clinic_id } = body

    // Get patient ID
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('auth0_id', session.user.sub)
      .single()

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Create appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id: patient.id,
        clinic_id: clinic_id || null,
        doctor_name,
        appointment_type,
        appointment_date: appointment_date || new Date().toISOString(),
        status: 'scheduled',
        assistant_enabled: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id
    })
  } catch (error: any) {
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
