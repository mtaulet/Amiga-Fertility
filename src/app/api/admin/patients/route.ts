import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/admin/patients — list all patients with their latest appointment
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: patients, error } = await supabaseAdmin
    .from('patients')
    .select(`
      id, email, first_name, last_name, date_of_birth, sex,
      phone_number, timezone, fertility_goals, treatment_timeline,
      intake_completed, created_at, updated_at,
      appointments (
        id, appointment_date, appointment_type, status, clinic_name, doctor_name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Admin patients fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }

  // Also fetch clinic selections so we know which clinic each patient chose
  const { data: selections } = await supabaseAdmin
    .from('patient_clinic_selections')
    .select('patient_id, clinic_id, selection_type')
    .eq('selection_type', 'patient')

  const selectionsByPatient: Record<string, string> = {}
  for (const s of selections ?? []) {
    selectionsByPatient[s.patient_id] = s.clinic_id
  }

  const enriched = (patients ?? []).map(p => ({
    ...p,
    selected_clinic_id: selectionsByPatient[p.id] ?? null,
  }))

  return NextResponse.json({ patients: enriched })
}

// POST /api/admin/patients — create a new patient record (no Auth0 user created)
export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const {
      email, first_name, last_name, date_of_birth, sex,
      phone_number, address_line1, city, postal_code, country, timezone,
      partner_name, partner_last_name, partner_email, partner_phone, partner_sex, partner_dob,
      fertility_goals, treatment_timeline,
      last_period_date, cycle_duration_days, regular_cycles, on_birth_control,
      past_experience,
      clinic_id,
    } = body

    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

    // Use a synthetic auth0_id for admin-created patients so the column constraint is met.
    // They can link a real Auth0 account later.
    const synthetic_auth0_id = `admin|${Date.now()}`

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .insert({
        auth0_id: synthetic_auth0_id,
        email,
        first_name: first_name || null,
        last_name: last_name || null,
        date_of_birth: date_of_birth || null,
        sex: sex || null,
        phone_number: phone_number || null,
        address_line1: address_line1 || null,
        city: city || null,
        postal_code: postal_code || null,
        country: country || null,
        timezone: timezone || null,
        partner_name: partner_name || null,
        partner_last_name: partner_last_name || null,
        partner_email: partner_email || null,
        partner_phone: partner_phone || null,
        partner_sex: partner_sex || null,
        partner_dob: partner_dob || null,
        fertility_goals: fertility_goals ?? [],
        treatment_timeline: treatment_timeline || null,
        last_period_date: last_period_date || null,
        cycle_duration_days: cycle_duration_days ?? null,
        regular_cycles: regular_cycles ?? null,
        on_birth_control: on_birth_control ?? null,
        past_experience: past_experience || null,
        intake_completed: true,
        intake_completed_at: new Date().toISOString(),
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // If a clinic was selected, create the clinic selection record
    if (clinic_id) {
      await supabaseAdmin.from('patient_clinic_selections').insert({
        patient_id: patient.id,
        clinic_id,
        selection_type: 'patient',
        slot_position: 1,
      })
    }

    return NextResponse.json({ patient }, { status: 201 })
  } catch (error: any) {
    console.error('Admin create patient error:', error)
    return NextResponse.json({ error: error.message ?? 'Failed to create patient' }, { status: 500 })
  }
}
