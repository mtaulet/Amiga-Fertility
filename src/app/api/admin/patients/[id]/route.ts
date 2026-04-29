import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/admin/patients/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const { data: patient, error } = await supabaseAdmin
    .from('patients')
    .select(`
      *,
      appointments (
        id, appointment_date, appointment_type, status,
        clinic_name, doctor_name, created_at
      )
    `)
    .eq('id', id)
    .single()

  if (error || !patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  // Fetch clinic selection
  const { data: selection } = await supabaseAdmin
    .from('patient_clinic_selections')
    .select('clinic_id')
    .eq('patient_id', id)
    .eq('selection_type', 'patient')
    .maybeSingle()

  return NextResponse.json({
    patient: { ...patient, selected_clinic_id: selection?.clinic_id ?? null },
  })
}

// PUT /api/admin/patients/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  try {
    const body = await request.json()

    // Strip immutable fields
    const {
      id: _id, auth0_id, created_at, intake_completed_at,
      terms_accepted_at, appointments, selected_clinic_id,
      ...allowed
    } = body

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .update({ ...allowed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update clinic selection if provided
    if (selected_clinic_id !== undefined) {
      await supabaseAdmin
        .from('patient_clinic_selections')
        .delete()
        .eq('patient_id', id)
        .eq('selection_type', 'patient')

      if (selected_clinic_id) {
        await supabaseAdmin.from('patient_clinic_selections').insert({
          patient_id: id,
          clinic_id: selected_clinic_id,
          selection_type: 'patient',
          slot_position: 1,
        })
      }
    }

    return NextResponse.json({ patient })
  } catch (error: any) {
    console.error('Admin update patient error:', error)
    return NextResponse.json({ error: error.message ?? 'Update failed' }, { status: 500 })
  }
}
