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

    const { filename } = await request.json()
    const ext = filename?.split('.').pop() ?? 'audio'
    const storagePath = `${patient.id}/${appointmentId}/${Date.now()}.${ext}`

    await supabaseAdmin.storage.createBucket(BUCKET, { public: false }).catch(() => {})

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error) throw error

    return NextResponse.json({ storagePath, token: data.token })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to create upload URL' }, { status: 500 })
  }
}
