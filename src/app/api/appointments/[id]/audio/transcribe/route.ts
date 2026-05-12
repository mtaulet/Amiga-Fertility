import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'
import { transcribeAudio } from '@/lib/azure-speech'

export const maxDuration = 60

const BUCKET = 'appointment-audios'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth0.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: appointmentId } = await params

    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('auth0_id', session.user.sub)
      .single()

    if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('id', appointmentId)
      .eq('patient_id', patient.id)
      .single()

    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { storagePath, mimeType, filename } = await request.json()

    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 120)

    if (urlError) throw urlError

    const fileResponse = await fetch(urlData.signedUrl)
    if (!fileResponse.ok) throw new Error('Failed to download audio from storage')

    const buffer = Buffer.from(await fileResponse.arrayBuffer())
    const transcriptText = await transcribeAudio(buffer, mimeType || 'audio/mpeg', filename || 'audio.mp3')

    const now = new Date().toISOString()

    await supabaseAdmin
      .from('appointments')
      .update({
        audio_file_url: storagePath,
        audio_uploaded_at: now,
        transcript_text: transcriptText,
        transcript_generated_at: now,
        updated_at: now,
      })
      .eq('id', appointmentId)

    return NextResponse.json({
      success: true,
      storagePath,
      uploadedAt: now,
      transcriptText,
      transcriptGeneratedAt: now,
    })
  } catch (error: any) {
    const message = process.env.NODE_ENV === 'development'
      ? (error.message ?? 'Transcription failed')
      : 'Transcription failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
