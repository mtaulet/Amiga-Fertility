import express from 'express'
import http from 'http'
import dotenv from 'dotenv'
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

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

// Initialize clients
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Cartesia agent phone number
const CARTESIA_AGENT_PHONE = process.env.CARTESIA_AGENT_PHONE || '+13158478049'

// Active calls tracking
const activeCalls = new Map()

const PORT = process.env.PORT || 3001

console.log(`
╔════════════════════════════════════════════════════════════╗
║  Amiga Voice Server - Twilio ↔ Cartesia Phone Bridge      ║
╚════════════════════════════════════════════════════════════╝

Configuration:
- Twilio Account: ${process.env.TWILIO_ACCOUNT_SID}
- Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER}
- Cartesia Agent Phone: ${CARTESIA_AGENT_PHONE}
- Database: Supabase connected

Starting server on port ${PORT}...
`)

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Amiga Voice Server - Cartesia Phone Bridge',
    activeCalls: activeCalls.size,
    cartesiaPhone: CARTESIA_AGENT_PHONE
  })
})

// Start an AI-assisted appointment call
app.post('/api/appointments/:appointmentId/start-call', async (req, res) => {
  const { appointmentId } = req.params
  const { doctorPhone, patientPhone } = req.body

  console.log(`\n📞 Starting AI-assisted appointment: ${appointmentId}`)
  console.log(`   Doctor: ${doctorPhone}`)
  console.log(`   Patient: ${patientPhone}`)
  console.log(`   AI Assistant: ${CARTESIA_AGENT_PHONE}`)

  try {
    // Update appointment status
    await supabase
      .from('appointments')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', appointmentId)

    // Create TwiML for conference
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
      await twilioClient.calls.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: patientPhone,
        url: twimlUrl + '?participant=patient',
        statusCallback: `${process.env.BASE_URL || 'http://localhost:' + PORT}/webhooks/call-status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      })
    }, 3000)

    // Call Cartesia AI agent (with longer delay to let doctor/patient join first)
    setTimeout(async () => {
      try {
        await twilioClient.calls.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: CARTESIA_AGENT_PHONE,
          url: twimlUrl + '?participant=ai-assistant',
          statusCallback: `${process.env.BASE_URL || 'http://localhost:' + PORT}/webhooks/call-status`,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
        })
        console.log('   ✅ AI assistant call initiated')
      } catch (error) {
        console.log('   ⚠️  Could not call AI assistant:', error.message)
        console.log('   ℹ️  Doctor and patient can still talk without AI')
        if (error.code === 21219) {
          console.log('   💡 Upgrade Twilio to paid account to add AI assistant')
        }
      }
    }, 6000)

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
      message: 'Calls initiated. Doctor, patient, and AI assistant will be connected shortly.'
    })

  } catch (error) {
    console.error('❌ Error starting call:', error)
    res.status(500).json({ error: error.message })
  }
})

// TwiML for conference
app.post('/twiml/conference/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params
  const { participant } = req.query

  console.log(`   ${participant} connecting to conference...`)

  const greeting = participant === 'doctor'
    ? 'Connecting you to the appointment.'
    : participant === 'patient'
    ? 'Connecting you to your doctor.'
    : 'Welcome to the appointment, Amiga.'

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${greeting}</Say>
  <Dial>
    <Conference
      statusCallback="${process.env.BASE_URL || 'http://localhost:' + PORT}/webhooks/conference-status"
      statusCallbackEvent="start,end,join,leave"
      beep="false"
      waitUrl=""
      startConferenceOnEnter="${participant !== 'ai-assistant'}"
      endConferenceOnExit="${participant === 'doctor' || participant === 'patient'}"
    >appointment-${appointmentId}</Conference>
  </Dial>
</Response>`

  res.type('text/xml')
  res.send(twiml)
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
  console.log(`   Cartesia Agent: ${CARTESIA_AGENT_PHONE}`)
  console.log(`   Ready to handle appointments!`)
  console.log('')
})
