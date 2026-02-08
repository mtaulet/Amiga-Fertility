import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'
import { demographicsSchema } from '@/lib/validation/demographics'

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validatedData = demographicsSchema.parse(body)

    // 3. Get or create patient record
    const { data: existingPatient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('auth0_id', session.user.sub)
      .single()

    const timestamp = new Date().toISOString()

    if (existingPatient) {
      // Update existing patient
      const { error: updateError } = await supabaseAdmin
        .from('patients')
        .update({
          ...validatedData,
          terms_accepted_at: validatedData.terms_accepted ? timestamp : null,
          intake_completed: true,
          intake_completed_at: timestamp,
          updated_at: timestamp,
        })
        .eq('id', existingPatient.id)

      if (updateError) throw updateError
    } else {
      // Create new patient record
      const { error: insertError } = await supabaseAdmin
        .from('patients')
        .insert({
          auth0_id: session.user.sub,
          email: session.user.email!,
          ...validatedData,
          terms_accepted_at: validatedData.terms_accepted ? timestamp : null,
          intake_completed: true,
          intake_completed_at: timestamp,
        })

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Demographics submission error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to save demographics' },
      { status: 500 }
    )
  }
}
