import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

async function getPatientId(auth0Id: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('patients')
    .select('id')
    .eq('auth0_id', auth0Id)
    .single()
  return data?.id ?? null
}

export async function GET() {
  try {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = await getPatientId(session.user.sub)
    if (!patientId) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const [selectionsResult, patientResult] = await Promise.all([
      supabaseAdmin
        .from('patient_clinic_selections')
        .select('*')
        .eq('patient_id', patientId),
      supabaseAdmin
        .from('patients')
        .select('clinic_selection_confirmed_at')
        .eq('id', patientId)
        .single(),
    ])

    if (selectionsResult.error) throw selectionsResult.error

    return NextResponse.json({
      selections: selectionsResult.data ?? [],
      confirmed_at: patientResult.data?.clinic_selection_confirmed_at ?? null,
    })
  } catch (error) {
    console.error('GET /api/clinics/selections error:', error)
    return NextResponse.json({ error: 'Failed to fetch selections' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = await getPatientId(session.user.sub)
    if (!patientId) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const body = await request.json()
    const { clinic_id, selection_type, slot_position, note } = body

    if (!clinic_id || !selection_type || !slot_position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('patient_clinic_selections')
      .upsert(
        {
          patient_id: patientId,
          clinic_id,
          selection_type,
          slot_position,
          note: note ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'patient_id,selection_type,slot_position' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ selection: data })
  } catch (error) {
    console.error('PUT /api/clinics/selections error:', error)
    return NextResponse.json({ error: 'Failed to save selection' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = await getPatientId(session.user.sub)
    if (!patientId) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const body = await request.json()
    const { selection_type, slot_position } = body

    if (!selection_type || !slot_position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('patient_clinic_selections')
      .delete()
      .eq('patient_id', patientId)
      .eq('selection_type', selection_type)
      .eq('slot_position', slot_position)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/clinics/selections error:', error)
    return NextResponse.json({ error: 'Failed to delete selection' }, { status: 500 })
  }
}
