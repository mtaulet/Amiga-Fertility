import express from 'express'
import { WebSocketServer } from 'ws'
import http from 'http'
import dotenv from 'dotenv'
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

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

// Active calls tracking
const activeCalls = new Map()

const PORT = process.env.PORT || 3001
const CARTESIA_AGENT_URL = process.env.CARTESIA_AGENT_URL || 'ws://localhost:8000'

console.log(`
╔════════════════════════════════════════════════════════════╗
║  Amiga Voice Server - Twilio ↔ Cartesia Line Bridge       ║
╚════════════════════════════════════════════════════════════╝

Configuration:
- Twilio Account: ${process.env.TWILIO_ACCOUNT_SID}
- Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER}
- Cartesia Agent: ${CARTESIA_AGENT_URL}
- Database: Supabase connected

Starting server on port ${PORT}...
`)

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Amiga Voice Server - Twilio Bridge',
    activeCalls: activeCalls.size
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
    const twimlUrl = `${process.env.BASE_URL ||'http://localhost:' + PORT}/twiml/conference/${appointmentId}`

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
wss.on('connection', (twilioWs, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathParts = url.pathname.split('/')
  const appointmentId = pathParts[pathParts.length - 1]
  const participant = url.searchParams.get('participant') || 'unknown'

  console.log(`🎙️  MediaStream connected: ${participant} (${appointmentId})`)

  let cartesiaWs = null
  let streamSid = null

  // Connect to Cartesia Line agent
  const connectToCartesia = () => {
    try {
      // Connect to Cartesia Line agent's WebSocket endpoint
      // This will stream audio to/from the AI agent
      cartesiaWs = new WebSocket(`${CARTESIA_AGENT_URL}/stream`)

      cartesiaWs.on('open', () => {
        console.log(`✅ Connected to Cartesia Line agent`)

        // Send initial configuration
        cartesiaWs.send(JSON.stringify({
          event: 'start',
          appointmentId,
          participant,
          audioFormat: {
            encoding: 'mulaw',
            sampleRate: 8000,
            channels: 1
          }
        }))
      })

      cartesiaWs.on('message', (data) => {
        // Receive audio from Cartesia AI and send to Twilio
        try {
          const message = JSON.parse(data)

          if (message.event === 'media' && streamSid) {
            // Forward AI audio to Twilio call
            twilioWs.send(JSON.stringify({
              event: 'media',
              streamSid,
              media: {
                payload: message.payload
              }
            }))
          } else if (message.event === 'transcript') {
            // Log transcript to database
            console.log(`🤖 AI: ${message.text}`)
            supabase.table('conversation_segments').insert({
              appointment_id: appointmentId,
              speaker: 'assistant',
              text: message.text,
              is_final: true
            }).execute()
          }
        } catch (err) {
          console.error('Error processing Cartesia message:', err)
        }
      })

      cartesiaWs.on('error', (error) => {
        console.error('❌ Cartesia WebSocket error:', error.message)
      })

      cartesiaWs.on('close', () => {
        console.log('Cartesia WebSocket closed')
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
          if (cartesiaWs && cartesiaWs.readyState === WebSocket.OPEN) {
            cartesiaWs.send(JSON.stringify({
              event: 'media',
              payload: message.media.payload,
              participant
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
  console.log(`   Ready to handle appointments!`)
  console.log('')
})
