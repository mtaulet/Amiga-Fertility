import { NextResponse } from 'next/server'
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

export async function POST() {
  try {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = await getPatientId(session.user.sub)
    if (!patientId) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('patients')
      .update({ clinic_selection_confirmed_at: new Date().toISOString() })
      .eq('id', patientId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/clinics/confirm error:', error)
    return NextResponse.json({ error: 'Failed to confirm selection' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = await getPatientId(session.user.sub)
    if (!patientId) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('patients')
      .update({ clinic_selection_confirmed_at: null })
      .eq('id', patientId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/clinics/confirm error:', error)
    return NextResponse.json({ error: 'Failed to un-confirm selection' }, { status: 500 })
  }
}
