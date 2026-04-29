import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function POST() {
  try {
    const session = await auth0.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('auth0_id', session.user.sub)
      .single()

    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    // Get latest appointment with a transcript
    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('id, transcript_text, appointment_date')
      .eq('patient_id', patient.id)
      .not('transcript_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!appointment?.transcript_text) {
      return NextResponse.json(
        { error: 'No transcript found. Upload and transcribe an appointment recording first.' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const appointmentDate = appointment.appointment_date
      ? new Date(appointment.appointment_date).toISOString().split('T')[0]
      : today

    const prompt = `You are a fertility treatment plan extractor. Given a doctor-patient appointment transcript, extract the treatment protocol as date ranges.

Return a JSON array where each object is one type of task with a start and end date (use the same date for both if it's a single-day event):
{
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "task": "Location and activity type (e.g. 'At home, Birth control', 'On-site, clinic visit', 'At home, stims.', 'At home, TRIGGER', 'On-site, RETRIEVAL DAY')",
  "goal": "Brief goal",
  "detail": "Specific instructions with medication names and doses",
  "event_type": "medication|injection|clinic|trigger|retrieval|other",
  "sort_order": 1
}

Rules:
- Use date ranges for daily recurring tasks (e.g. daily BC pills from Mar 1–31 = one object with start_date/end_date spanning that period)
- For single-day events (clinic visit, trigger, retrieval) set start_date == end_date
- A single day can have multiple task types — give each a different sort_order
- event_type: medication = oral pills, injection = subcutaneous shots, clinic = office visit/ultrasound/blood work, trigger = trigger shot, retrieval = egg retrieval
- Convert relative dates to absolute YYYY-MM-DD (appointment date: ${appointmentDate}, today: ${today})
- Keep the array compact — use ranges, not individual days

Return ONLY the JSON array, no markdown, no explanation.

Transcript:
${appointment.transcript_text}`

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4096,
    })

    const raw = completion.choices[0].message.content ?? '[]'
    const jsonText = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const extracted = JSON.parse(jsonText)

    if (!Array.isArray(extracted)) {
      throw new Error('GPT-4 returned non-array response')
    }

    // Expand date ranges into individual daily rows
    function expandRange(e: any): { date: string; task: string; goal: string | null; detail: string | null; event_type: string; sort_order: number }[] {
      const start = new Date(e.start_date + 'T00:00:00')
      const end = new Date((e.end_date ?? e.start_date) + 'T00:00:00')
      const rows = []
      const cur = new Date(start)
      while (cur <= end) {
        const y = cur.getFullYear()
        const m = String(cur.getMonth() + 1).padStart(2, '0')
        const d = String(cur.getDate()).padStart(2, '0')
        rows.push({
          date: `${y}-${m}-${d}`,
          task: e.task,
          goal: e.goal ?? null,
          detail: e.detail ?? null,
          event_type: e.event_type ?? 'other',
          sort_order: e.sort_order ?? 1,
        })
        cur.setDate(cur.getDate() + 1)
      }
      return rows
    }

    const expanded = extracted.flatMap(expandRange)

    // Replace existing events for this patient
    await supabaseAdmin
      .from('treatment_events')
      .delete()
      .eq('patient_id', patient.id)

    const generatedAt = new Date().toISOString()

    if (expanded.length > 0) {
      const rows = expanded.map((e) => ({
        patient_id: patient.id,
        appointment_id: appointment.id,
        ...e,
      }))

      const { error: insertError } = await supabaseAdmin
        .from('treatment_events')
        .insert(rows)

      if (insertError) throw insertError
    }

    await supabaseAdmin
      .from('appointments')
      .update({ treatment_generated_at: generatedAt })
      .eq('id', appointment.id)

    const { data: events } = await supabaseAdmin
      .from('treatment_events')
      .select('*')
      .eq('patient_id', patient.id)
      .order('date')
      .order('sort_order')

    return NextResponse.json({ events: events ?? [], generatedAt })
  } catch (error: any) {
    console.error('Treatment generate error:', error)
    const message = process.env.NODE_ENV === 'development'
      ? (error.message ?? 'Generation failed')
      : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
