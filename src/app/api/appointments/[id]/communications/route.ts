import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: appointmentId } = await params
    const body = await request.json()

    // Get patient record
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('auth0_id', session.user.sub)
      .single()

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Verify this appointment belongs to the patient
    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('id', appointmentId)
      .eq('patient_id', patient.id)
      .single()

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const updates: Record<string, string | null> = {}

    if ('communications_text' in body) {
      updates.communications_text = body.communications_text
      updates.communications_updated_at = now
    }
    if ('communications_summary' in body) {
      updates.communications_summary = body.communications_summary
      updates.communications_summary_reviewed_at = now
    }
    if ('generated_summary' in body) {
      updates.generated_summary = body.generated_summary
      updates.generated_summary_reviewed_at = now
    }

    updates.updated_at = now

    const { error } = await supabaseAdmin
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}
