import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

const BUCKET = 'appointment-audios'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth0.getSession()
    if (!session) {
      console.log('[upload-url] No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: appointmentId } = await params
    const { filename } = await request.json()
    console.log(`[upload-url] user=${session.user.sub} appointmentId=${appointmentId} filename=${filename}`)

    const { data: providerRow } = await supabaseAdmin
      .from('clinic_providers')
      .select('id')
      .eq('auth0_id', session.user.sub)
      .limit(1)
      .single()

    let uploaderId: string

    if (providerRow) {
      console.log('[upload-url] caller is provider')
      const { data: appointment } = await supabaseAdmin
        .from('appointments')
        .select('id, patient_id')
        .eq('id', appointmentId)
        .single()
      if (!appointment) {
        console.log('[upload-url] appointment not found for provider')
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      uploaderId = appointment.patient_id
    } else {
      console.log('[upload-url] caller is patient')
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('auth0_id', session.user.sub)
        .single()
      if (!patient) {
        console.log('[upload-url] patient record not found')
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      const { data: appointment } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('id', appointmentId)
        .eq('patient_id', patient.id)
        .single()
      if (!appointment) {
        console.log('[upload-url] appointment not found for patient')
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      uploaderId = patient.id
    }

    const ext = filename?.split('.').pop() ?? 'audio'
    const storagePath = `${uploaderId}/${appointmentId}/${Date.now()}.${ext}`
    console.log(`[upload-url] storagePath=${storagePath}`)

    await supabaseAdmin.storage.createBucket(BUCKET, { public: false }).catch(() => {})

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error) {
      console.error('[upload-url] createSignedUploadUrl error:', error)
      throw error
    }

    console.log('[upload-url] signed URL created ok')
    return NextResponse.json({ storagePath, token: data.token })
  } catch (error: any) {
    console.error('[upload-url] caught error:', error)
    return NextResponse.json({ error: error.message ?? 'Failed to create upload URL' }, { status: 500 })
  }
}
