import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

const BUCKET = 'appointment-audios'

async function getVerifiedIds(auth0Id: string, appointmentId: string) {
  const { data: patient } = await supabaseAdmin
    .from('patients')
    .select('id')
    .eq('auth0_id', auth0Id)
    .single()

  if (!patient) return null

  const { data: appointment } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('id', appointmentId)
    .eq('patient_id', patient.id)
    .single()

  if (!appointment) return null

  return { patientId: patient.id, appointmentId: appointment.id }
}

// GET — return a short-lived signed URL for playback/download
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth0.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: appointmentId } = await params
    const ids = await getVerifiedIds(session.user.sub, appointmentId)
    if (!ids) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('audio_file_url')
      .eq('id', appointmentId)
      .single()

    if (!appointment?.audio_file_url) {
      return NextResponse.json({ error: 'No audio file' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(appointment.audio_file_url, 3600)

    if (error) throw error

    return NextResponse.json({ url: data.signedUrl })
  } catch (error: any) {
    console.error('Audio URL error:', error)
    return NextResponse.json({ error: 'Failed to get audio URL' }, { status: 500 })
  }
}
