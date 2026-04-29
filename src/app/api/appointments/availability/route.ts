import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { slots, note, timezone } = body

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: 'At least one availability slot is required' }, { status: 400 })
    }

    // Validate each slot
    for (const slot of slots) {
      if (!slot.date || !slot.start_time || !slot.end_time) {
        return NextResponse.json({ error: 'Each slot must have a date, start time, and end time' }, { status: 400 })
      }
    }

    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('auth0_id', session.user.sub)
      .single()

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Get confirmed clinic (with name)
    const { data: selection } = await supabaseAdmin
      .from('patient_clinic_selections')
      .select('clinic_id, clinics(name)')
      .eq('patient_id', patient.id)
      .eq('selection_type', 'downselection')
      .eq('slot_position', 1)
      .single()

    const clinicId = (selection as any)?.clinic_id ?? null

    // Create a pending appointment with the offered slots stored in notes
    const firstSlot = slots[0]
    const appointmentDate = new Date(`${firstSlot.date}T${firstSlot.start_time}`).toISOString()

    const { data: appointment, error: apptError } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id: patient.id,
        clinic_id: clinicId,
        appointment_type: 'consultation',
        appointment_date: appointmentDate,
        status: 'pending',
        assistant_enabled: false,
        notes: JSON.stringify({
          type: 'availability',
          slots,
          note: note ?? null,
          timezone: timezone ?? null,
        }),
      })
      .select()
      .single()

    if (apptError) throw apptError

    return NextResponse.json({ success: true, id: appointment.id })
  } catch (error: any) {
    console.error('Availability submission error:', error)
    const message = process.env.NODE_ENV === 'development'
      ? (error.message ?? error.details ?? 'Failed to submit availability')
      : 'Failed to submit availability'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
