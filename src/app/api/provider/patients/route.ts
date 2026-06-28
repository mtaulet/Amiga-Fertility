import { NextResponse } from 'next/server'
import { getProviderClinic } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const ctx = await getProviderClinic()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!ctx.clinic) return NextResponse.json({ patients: [] })

  // Get patient IDs for this clinic via appointments
  const { data: appts } = await supabaseAdmin
    .from('appointments')
    .select('patient_id')
    .eq('clinic_id', ctx.clinic.id)

  const patientIds = [...new Set((appts ?? []).map(a => a.patient_id).filter(Boolean))]

  if (patientIds.length === 0) return NextResponse.json({ patients: [] })

  const { data: patients, error } = await supabaseAdmin
    .from('patients')
    .select('id, first_name, last_name, email, phone_number, date_of_birth, intake_completed, created_at')
    .in('id', patientIds)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ patients: patients ?? [] })
}
