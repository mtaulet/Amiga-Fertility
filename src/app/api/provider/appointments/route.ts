import { NextResponse } from 'next/server'
import { getProviderClinic } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const ctx = await getProviderClinic()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!ctx.clinic) return NextResponse.json({ appointments: [] })

  const { data: appointments, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      id, appointment_date, appointment_type, status, clinic_name, doctor_name,
      video_room_url, transcript_text, transcript_generated_at, audio_uploaded_at,
      patient:patients(id, first_name, last_name, email)
    `)
    .eq('clinic_id', ctx.clinic.id)
    .order('appointment_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointments: appointments ?? [] })
}
