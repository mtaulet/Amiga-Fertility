import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (error: any) {
    console.error('Clinics fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch clinics' }, { status: 500 })
  }
}
