import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

export const maxDuration = 60 // seconds — needed for Whisper transcription

const BUCKET = 'appointment-audios'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

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

// POST — upload audio then transcribe
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth0.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: appointmentId } = await params
    const ids = await getVerifiedIds(session.user.sub, appointmentId)
    if (!ids) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('audio') as File | null
    if (!file) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })

    // ── 1. Upload to Supabase Storage ──────────────────────────────────────
    await supabaseAdmin.storage.createBucket(BUCKET, { public: false }).catch(() => {})

    const ext = file.name.split('.').pop() ?? 'audio'
    const storagePath = `${ids.patientId}/${appointmentId}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const uploadedAt = new Date().toISOString()

    // ── 2. Transcribe with Whisper ─────────────────────────────────────────
    // Re-wrap the buffer as a File so the OpenAI SDK receives a named file
    const audioFile = new File([buffer], file.name, { type: file.type || 'audio/mpeg' })

    const transcription = await getOpenAI().audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
    })

    const transcriptText = transcription.text
    const transcriptGeneratedAt = new Date().toISOString()

    // ── 3. Save both to the appointment ────────────────────────────────────
    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({
        audio_file_url: storagePath,
        audio_uploaded_at: uploadedAt,
        transcript_text: transcriptText,
        transcript_generated_at: transcriptGeneratedAt,
        updated_at: transcriptGeneratedAt,
      })
      .eq('id', appointmentId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      storagePath,
      uploadedAt,
      transcriptText,
      transcriptGeneratedAt,
    })
  } catch (error: any) {
    console.error('Audio upload/transcribe error:', error)
    const message = process.env.NODE_ENV === 'development'
      ? (error.message ?? 'Upload failed')
      : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
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
