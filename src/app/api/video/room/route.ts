import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { requireProvider } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { appointmentId } = await request.json()

    // Check if caller is a provider
    const providerSession = await requireProvider()
    const isProvider = !!providerSession

    let appointmentRoomUrl: string | null = null

    if (isProvider) {
      // Providers can join any appointment
      const { data: appointment } = await supabaseAdmin
        .from('appointments')
        .select('id, video_room_url')
        .eq('id', appointmentId)
        .single()

      if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      appointmentRoomUrl = appointment.video_room_url
    } else {
      // Patients can only join their own appointment
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('auth0_id', session.user.sub)
        .single()

      if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const { data: appointment } = await supabaseAdmin
        .from('appointments')
        .select('id, video_room_url')
        .eq('id', appointmentId)
        .eq('patient_id', patient.id)
        .single()

      if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      appointmentRoomUrl = appointment.video_room_url
    }

    // Reuse existing room if it still exists in Daily
    if (appointmentRoomUrl) {
      const roomName = appointmentRoomUrl.split('/').pop()
      const checkRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
      })
      if (checkRes.ok) {
        const token = await createMeetingToken(appointmentRoomUrl, isProvider)
        return NextResponse.json({ url: appointmentRoomUrl, token })
      }
      // Room expired — fall through to create a new one
    }

    // Create a new Daily room
    const roomRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        privacy: 'private',
        properties: {
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        },
      }),
    })

    if (!roomRes.ok) {
      const err = await roomRes.text()
      throw new Error(`Daily room creation failed: ${err}`)
    }

    const room = await roomRes.json()

    await supabaseAdmin
      .from('appointments')
      .update({ video_room_url: room.url })
      .eq('id', appointmentId)

    const token = await createMeetingToken(room.url, isProvider)
    return NextResponse.json({ url: room.url, token })
  } catch (error: any) {
    const message = process.env.NODE_ENV === 'development'
      ? (error.message ?? 'Failed to create room')
      : 'Failed to create room'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function createMeetingToken(roomUrl: string, isOwner: boolean) {
  const roomName = roomUrl.split('/').pop()
  const res = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
        is_owner: isOwner,
      },
    }),
  })
  const data = await res.json()
  return data.token
}
