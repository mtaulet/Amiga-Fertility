import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/admin/appointments — all appointments with patient info
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      id, appointment_date, appointment_type, status,
      clinic_name, doctor_name, notes, created_at,
      patient:patients (id, first_name, last_name, email)
    `)
    .order('appointment_date', { ascending: false })

  if (error) {
    console.error('Admin appointments fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }

  return NextResponse.json({ appointments: data ?? [] })
}

// POST /api/admin/appointments — create appointment for any patient
export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const {
      patient_id, appointment_date, appointment_type,
      clinic_id, clinic_name, doctor_name, status, notes,
    } = body

    if (!patient_id || !appointment_date) {
      return NextResponse.json(
        { error: 'patient_id and appointment_date are required' },
        { status: 400 }
      )
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id,
        appointment_date,
        appointment_type: appointment_type || 'First Appointment',
        clinic_id: clinic_id || null,
        clinic_name: clinic_name || null,
        doctor_name: doctor_name || null,
        status: status || 'scheduled',
        notes: notes || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error: any) {
    console.error('Admin create appointment error:', error)
    return NextResponse.json({ error: error.message ?? 'Failed to create appointment' }, { status: 500 })
  }
}
