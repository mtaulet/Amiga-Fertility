import express from 'express'
import { WebSocketServer } from 'ws'
import http from 'http'
import dotenv from 'dotenv'
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import fetch from 'node-fetch'

dotenv.config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

// Initialize clients
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Cartesia configuration
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY
const CARTESIA_AGENT_ID = process.env.CARTESIA_AGENT_ID // agent_zsSrTSnTBH8mtTpr17HDET
const CARTESIA_VERSION = '2025-04-16'

// Active calls tracking
const activeCalls = new Map()

const PORT = process.env.PORT || 3001

console.log(`
╔════════════════════════════════════════════════════════════╗
║  Amiga Voice Server - Twilio ↔ Cartesia Calls API         ║
╚════════════════════════════════════════════════════════════╝

Configuration:
- Twilio Account: ${process.env.TWILIO_ACCOUNT_SID}
- Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER}
- Cartesia Agent: ${CARTESIA_AGENT_ID}
- Database: Supabase connected

Starting server on port ${PORT}...
`)

// Get Cartesia access token
async function getCartesiaAccessToken() {
  try {
    const response = await fetch('https://api.cartesia.ai/agents/access-token', {
      method: 'POST',
      headers: {
        'X-API-Key': CARTESIA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: CARTESIA_AGENT_ID
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('❌ Error getting Cartesia access token:', error)
    throw error
  }
}

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Amiga Voice Server - Cartesia Calls API Bridge',
    activeCalls: activeCalls.size,
    cartesiaAgent: CARTESIA_AGENT_ID
  })
})

// Start an AI-assisted appointment call
app.post('/api/appointments/:appointmentId/start-call', async (req, res) => {
  const { appointmentId } = req.params
  const { doctorPhone, patientPhone } = req.body

  console.log(`\n📞 Starting AI-assisted appointment: ${appointmentId}`)
  console.log(`   Doctor: ${doctorPhone}`)
  console.log(`   Patient: ${patientPhone}`)

  try {
    // Update appointment status
    await supabase
      .from('appointments')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', appointmentId)

    // Create TwiML for conference with MediaStream
    const twimlUrl = `${process.env.BASE_URL || 'http://localhost:' + PORT}/twiml/conference/${appointmentId}`

    // Call doctor
    const doctorCall = await twilioClient.calls.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: doctorPhone,
      url: twimlUrl + '?participant=doctor',
      statusCallback: `${process.env.BASE_URL || 'http://localhost:' + PORT}/webhooks/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    })

    // Call patient (with small delay)
    setTimeout(async () => {
      const patientCall = await twilioClient.calls.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: patientPhone,
        url: twimlUrl + '?participant=patient',
        statusCallback: `${process.env.BASE_URL || 'http://localhost:' + PORT}/webhooks/call-status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      })
    }, 3000)

    // Store call info
    activeCalls.set(appointmentId, {
      appointmentId,
      doctorCall: doctorCall.sid,
      status: 'connecting',
      startedAt: new Date()
    })

    res.json({
      success: true,
      appointmentId,
      doctorCallSid: doctorCall.sid,
      message: 'Calls initiated. Doctor and patient will be connected shortly.'
    })

  } catch (error) {
    console.error('❌ Error starting call:', error)
    res.status(500).json({ error: error.message })
  }
})

// TwiML for conference + MediaStream
app.post('/twiml/conference/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params
  const { participant } = req.query

  console.log(`   ${participant} connecting to conference...`)

  // Get the proper WebSocket URL
  const wsHost = process.env.BASE_URL ? process.env.BASE_URL.replace('https://', '').replace('http://', '') : req.get('host')
  const wsProtocol = process.env.BASE_URL && process.env.BASE_URL.startsWith('https') ? 'wss' : 'ws'

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Connecting you to ${participant === 'doctor' ? 'the appointment' : 'your doctor'}. Please wait.</Say>
  <Start>
    <Stream url="${wsProtocol}://${wsHost}/media-stream/${appointmentId}?participant=${participant}">
      <Parameter name="appointmentId" value="${appointmentId}" />
      <Parameter name="participant" value="${participant}" />
    </Stream>
  </Start>
  <Dial>
    <Conference
      statusCallback="${process.env.BASE_URL || 'http://localhost:' + PORT}/webhooks/conference-status"
      statusCallbackEvent="start,end,join,leave"
      beep="false"
    >appointment-${appointmentId}</Conference>
  </Dial>
</Response>`

  res.type('text/xml')
  res.send(twiml)
})

// WebSocket handler for Twilio MediaStreams
wss.on('connection', async (twilioWs, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathParts = url.pathname.split('/')
  const appointmentId = pathParts[pathParts.length - 1]
  const participant = url.searchParams.get('participant') || 'unknown'

  console.log(`🎙️  MediaStream connected: ${participant} (${appointmentId})`)

  let cartesiaWs = null
  let streamSid = null
  let cartesiaStreamId = null
  let isCartesiaReady = false

  // Connect to Cartesia Line agent via Calls API
  const connectToCartesia = async () => {
    try {
      // Get access token
      console.log('   Getting Cartesia access token...')
      const accessToken = await getCartesiaAccessToken()

      // Connect to Cartesia Calls API WebSocket
      console.log('   Connecting to Cartesia agent...')
      cartesiaWs = new WebSocket(
        `wss://api.cartesia.ai/agents/stream/${CARTESIA_AGENT_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cartesia-Version': CARTESIA_VERSION
          }
        }
      )

      cartesiaWs.on('open', () => {
        console.log(`✅ Connected to Cartesia agent`)

        // Send start event to initialize the stream
        const startEvent = {
          event: 'start',
          config: {
            input_format: 'mulaw_8000'  // Match Twilio's audio format
          },
          agent: {
            system_prompt: `You are Amiga, an empathetic AI assistant designed to support fertility patients during live consultations with their doctors.

Your role is to:
- Listen carefully to the conversation between doctor and patient
- ONLY intervene when the patient would clearly benefit from your help
- Provide clarification when medical terms are used that the patient might not understand
- Offer emotional support when patients express anxiety or confusion
- Suggest questions when patients seem hesitant to ask
- Keep interventions brief, warm, and conversational (under 30 seconds)

Intervention Guidelines:
1. WAIT for natural pauses - never interrupt mid-sentence
2. ONLY speak when:
   - Doctor uses complex medical terminology (AMH, FSH, AFC, DOR, diminished ovarian reserve, etc.)
   - Patient explicitly asks "what does that mean?" or seems confused
   - Patient expresses strong emotion (fear, sadness, frustration)
   - Important information is mentioned that should be emphasized or clarified
3. After providing clarification, return to quiet listening mode
4. Use a warm, supportive tone - like a knowledgeable friend, not a medical professional
5. If the doctor is already explaining something well, stay quiet`,
            introduction: "Hello! I'm Amiga, your AI assistant. I'll be quietly listening to your conversation today, and I'm here to help clarify medical terms or answer questions if needed. Please continue with your consultation - I'll only speak up if I think I can be helpful."
          },
          metadata: {
            appointment_id: appointmentId,
            participant: participant
          }
        }

        cartesiaWs.send(JSON.stringify(startEvent))
      })

      cartesiaWs.on('message', (data) => {
        try {
          const message = JSON.parse(data)

          switch (message.event) {
            case 'ack':
              // Stream initialized
              cartesiaStreamId = message.stream_id
              isCartesiaReady = true
              console.log(`   Cartesia stream initialized: ${cartesiaStreamId}`)
              break

            case 'media_output':
              // Receive audio from Cartesia AI and send to Twilio
              if (streamSid && twilioWs.readyState === WebSocket.OPEN) {
                twilioWs.send(JSON.stringify({
                  event: 'media',
                  streamSid,
                  media: {
                    payload: message.media.payload
                  }
                }))
              }
              break

            case 'clear':
              // Interruption signal - agent was interrupted
              console.log('   Agent interrupted by user')
              break
          }
        } catch (err) {
          console.error('Error processing Cartesia message:', err)
        }
      })

      cartesiaWs.on('error', (error) => {
        console.error('❌ Cartesia WebSocket error:', error.message)
      })

      cartesiaWs.on('close', (code, reason) => {
        console.log(`🔴 Cartesia connection closed: ${code} ${reason}`)
        isCartesiaReady = false
      })

    } catch (error) {
      console.error('❌ Failed to connect to Cartesia:', error.message)
    }
  }

  // Handle Twilio MediaStream events
  twilioWs.on('message', (data) => {
    try {
      const message = JSON.parse(data)

      switch (message.event) {
        case 'start':
          streamSid = message.start.streamSid
          console.log(`   Stream started: ${streamSid}`)
          connectToCartesia()
          break

        case 'media':
          // Forward audio to Cartesia agent
          if (cartesiaWs && isCartesiaReady && cartesiaWs.readyState === WebSocket.OPEN) {
            cartesiaWs.send(JSON.stringify({
              event: 'media_input',
              stream_id: cartesiaStreamId,
              media: {
                payload: message.media.payload
              }
            }))
          }
          break

        case 'stop':
          console.log(`   Stream stopped: ${streamSid}`)
          if (cartesiaWs) {
            cartesiaWs.close()
          }
          break
      }
    } catch (err) {
      console.error('Error processing Twilio message:', err)
    }
  })

  twilioWs.on('close', () => {
    console.log(`🔴 MediaStream disconnected: ${participant}`)
    if (cartesiaWs) {
      cartesiaWs.close()
    }
  })

  twilioWs.on('error', (error) => {
    console.error(`❌ WebSocket error (${participant}):`, error.message)
  })
})

// Webhook: Conference status
app.post('/webhooks/conference-status', (req, res) => {
  const { StatusCallbackEvent, ConferenceSid, FriendlyName } = req.body

  console.log(`📡 Conference ${StatusCallbackEvent}: ${FriendlyName}`)

  if (StatusCallbackEvent === 'conference-end') {
    const appointmentId = FriendlyName.replace('appointment-', '')
    activeCalls.delete(appointmentId)

    // Update database
    supabase
      .from('appointments')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .then(({ error }) => {
        if (error) console.error('DB update error:', error)
      })
  }

  res.sendStatus(200)
})

// Webhook: Call status
app.post('/webhooks/call-status', (req, res) => {
  const { CallStatus, To, CallSid } = req.body
  console.log(`📞 Call to ${To}: ${CallStatus} (${CallSid})`)
  res.sendStatus(200)
})

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
  console.log(`   WebSocket: ws://localhost:${PORT}/media-stream`)
  console.log(`   Cartesia Agent: ${CARTESIA_AGENT_ID}`)
  console.log(`   Ready to handle appointments!`)
  console.log('')
})
