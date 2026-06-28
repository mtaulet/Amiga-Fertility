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
    if (!session) {
      console.log('[transcribe] No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: appointmentId } = await params
    console.log(`[transcribe] user=${session.user.sub} appointmentId=${appointmentId}`)

    const { data: providerRow } = await supabaseAdmin
      .from('clinic_providers')
      .select('id')
      .eq('auth0_id', session.user.sub)
      .limit(1)
      .single()

    if (providerRow) {
      console.log('[transcribe] caller is provider')
      const { data: appointment } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('id', appointmentId)
        .single()
      if (!appointment) {
        console.log('[transcribe] appointment not found')
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    } else {
      console.log('[transcribe] caller is patient')
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('auth0_id', session.user.sub)
        .single()
      if (!patient) {
        console.log('[transcribe] patient record not found')
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      const { data: appointment } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('id', appointmentId)
        .eq('patient_id', patient.id)
        .single()
      if (!appointment) {
        console.log('[transcribe] appointment not found for patient')
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    const { storagePath, mimeType, filename } = await request.json()
    console.log(`[transcribe] storagePath=${storagePath} mimeType=${mimeType} filename=${filename}`)

    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 120)

    if (urlError) {
      console.error('[transcribe] createSignedUrl error:', urlError)
      throw urlError
    }

    console.log('[transcribe] downloading audio from storage')
    const fileResponse = await fetch(urlData.signedUrl)
    if (!fileResponse.ok) throw new Error(`Failed to download audio from storage: ${fileResponse.status}`)

    const buffer = Buffer.from(await fileResponse.arrayBuffer())
    console.log(`[transcribe] audio buffer size=${buffer.length}B, sending to Azure`)

    const transcriptText = await transcribeAudio(buffer, mimeType || 'audio/mpeg', filename || 'audio.mp3')
    console.log(`[transcribe] Azure returned ${transcriptText.length} chars`)

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

    console.log('[transcribe] DB updated, done')
    return NextResponse.json({
      success: true,
      storagePath,
      uploadedAt: now,
      transcriptText,
      transcriptGeneratedAt: now,
    })
  } catch (error: any) {
    console.error('[transcribe] caught error:', error)
    const message = process.env.NODE_ENV === 'development'
      ? (error.message ?? 'Transcription failed')
      : 'Transcription failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
