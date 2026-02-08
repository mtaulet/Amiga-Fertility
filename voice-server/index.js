import express from 'express'
import { WebSocketServer } from 'ws'
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { Cartesia } from '@cartesia/cartesia-js'
import { createClient as createDeepgramClient, LiveTranscriptionEvents } from '@deepgram/sdk'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const cartesia = new Cartesia({
  apiKey: process.env.CARTESIA_API_KEY
})

const deepgram = createDeepgramClient(process.env.DEEPGRAM_API_KEY)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Store active conversations
const activeConversations = new Map()

// ============================================================================
// TWILIO CONFERENCE SETUP
// ============================================================================

// Start a new appointment conference call
app.post('/api/appointments/:appointmentId/start-call', async (req, res) => {
  const { appointmentId } = req.params
  const { doctorPhone, patientPhone } = req.body

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    // Create a conference
    const conferenceName = `appointment-${appointmentId}`

    // Call the doctor
    const doctorCall = await client.calls.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: doctorPhone,
      twiml: `
        <Response>
          <Say>Connecting you to the appointment. The AI assistant Amiga will be listening and can help during the conversation.</Say>
          <Dial>
            <Conference
              statusCallback="https://${req.headers.host}/api/conference/status"
              statusCallbackEvent="start end join leave"
              startConferenceOnEnter="true"
              endConferenceOnExit="false"
              record="record-from-start"
              recordingStatusCallback="https://${req.headers.host}/api/recording/status"
            >${conferenceName}</Conference>
          </Dial>
        </Response>
      `
    })

    // Call the patient
    const patientCall = await client.calls.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: patientPhone,
      twiml: `
        <Response>
          <Say>Connecting you to your doctor. Our AI assistant Amiga will be listening to help clarify and support during the appointment.</Say>
          <Dial>
            <Conference
              startConferenceOnEnter="false"
              endConferenceOnExit="true"
            >${conferenceName}</Conference>
          </Dial>
        </Response>
      `
    })

    // Update appointment
    await supabase
      .from('appointments')
      .update({
        conference_sid: conferenceName,
        status: 'in_progress'
      })
      .eq('id', appointmentId)

    res.json({
      success: true,
      conferenceName,
      doctorCallSid: doctorCall.sid,
      patientCallSid: patientCall.sid
    })
  } catch (error) {
    console.error('Error starting call:', error)
    res.status(500).json({ error: error.message })
  }
})

// Handle conference status updates
app.post('/api/conference/status', async (req, res) => {
  const {
    ConferenceSid,
    StatusCallbackEvent,
    FriendlyName // appointment-{appointmentId}
  } = req.body

  const appointmentId = FriendlyName.replace('appointment-', '')

  if (StatusCallbackEvent === 'conference-start') {
    console.log(`Conference started: ${ConferenceSid}`)

    // Connect to conference for AI assistant
    await connectAIAssistant(ConferenceSid, appointmentId)
  }

  if (StatusCallbackEvent === 'conference-end') {
    console.log(`Conference ended: ${ConferenceSid}`)

    // Clean up
    activeConversations.delete(appointmentId)

    await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId)
  }

  res.sendStatus(200)
})

// ============================================================================
// AI ASSISTANT - CONNECTS TO CONFERENCE
// ============================================================================

async function connectAIAssistant(conferenceSid, appointmentId) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )

  // Add AI assistant as participant (connect to our WebSocket)
  const participant = await client.conferences(conferenceSid)
    .participants
    .create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `client:ai-assistant-${appointmentId}`,
      earlyMedia: true,
      endConferenceOnExit: false,
      startConferenceOnEnter: false
    })

  console.log(`AI assistant connected to conference: ${participant.callSid}`)

  return participant
}

// ============================================================================
// WEBSOCKET SERVER - RECEIVES AUDIO STREAMS
// ============================================================================

const wss = new WebSocketServer({ noServer: true })

wss.on('connection', async (ws, req) => {
  console.log('WebSocket connection established')

  let appointmentId = null
  let deepgramConnection = null
  let conversationContext = []
  let audioBuffer = []

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())

      // Connection start
      if (data.event === 'start') {
        appointmentId = data.start.customParameters?.appointmentId
        console.log(`Stream started for appointment: ${appointmentId}`)

        // Initialize Deepgram live transcription
        deepgramConnection = deepgram.listen.live({
          model: 'nova-2-medical',
          language: 'en',
          smart_format: true,
          punctuate: true,
          diarize: true, // Speaker identification
          interim_results: true,
          utterance_end_ms: 1000
        })

        // Handle transcription results
        deepgramConnection.on(LiveTranscriptionEvents.Transcript, async (transcription) => {
          const transcript = transcription.channel.alternatives[0]

          if (transcript.transcript.length > 0) {
            const isFinal = transcription.is_final
            const speaker = transcription.channel.alternatives[0].words?.[0]?.speaker || 0
            const speakerLabel = speaker === 0 ? 'doctor' : 'patient'

            console.log(`[${speakerLabel}] ${transcript.transcript} (final: ${isFinal})`)

            // Save to database
            const segment = await supabase
              .from('conversation_segments')
              .insert({
                appointment_id: appointmentId,
                speaker: speakerLabel,
                text: transcript.transcript,
                confidence: transcript.confidence,
                is_final: isFinal,
                start_time: transcription.start,
                end_time: transcription.start + transcription.duration
              })
              .select()
              .single()

            // Add to context
            conversationContext.push({
              speaker: speakerLabel,
              text: transcript.transcript,
              timestamp: new Date()
            })

            // Only process final transcripts for AI intervention
            if (isFinal) {
              await checkForAIIntervention(
                appointmentId,
                conversationContext,
                segment.data.id,
                ws
              )
            }
          }
        })

        deepgramConnection.on(LiveTranscriptionEvents.Error, (error) => {
          console.error('Deepgram error:', error)
        })
      }

      // Incoming audio from Twilio
      if (data.event === 'media') {
        const audioPayload = Buffer.from(data.media.payload, 'base64')

        // Send to Deepgram for transcription
        if (deepgramConnection) {
          deepgramConnection.send(audioPayload)
        }

        // Also buffer for recording
        audioBuffer.push(audioPayload)
      }

      // Stream stopped
      if (data.event === 'stop') {
        console.log('Stream stopped')
        if (deepgramConnection) {
          deepgramConnection.finish()
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error)
    }
  })

  ws.on('close', () => {
    console.log('WebSocket connection closed')
    if (deepgramConnection) {
      deepgramConnection.finish()
    }
  })
})

// ============================================================================
// AI INTERVENTION LOGIC
// ============================================================================

async function checkForAIIntervention(appointmentId, context, segmentId, ws) {
  // Don't intervene on every message - only when appropriate
  if (context.length < 4) return // Need some context first

  const recentContext = context.slice(-10) // Last 10 messages

  // Check if AI should intervene
  const systemPrompt = `You are an AI assistant named Amiga participating in a live doctor-patient fertility consultation. Your role is to:

1. Listen to the conversation in real-time
2. Decide if you should intervene to help
3. Only speak when truly helpful

Intervention criteria:
- Doctor uses complex medical terms patient might not understand
- Patient seems confused or hesitant to ask questions
- Important information is mentioned that should be emphasized
- Patient asks a question the doctor didn't fully answer
- Emotional support might be helpful

DO NOT intervene if:
- The conversation is flowing naturally
- The topic is being adequately covered
- It would interrupt an important moment

Recent conversation:
${recentContext.map(c => `${c.speaker}: ${c.text}`).join('\n')}

Should you intervene? If yes, what should you say? Respond in JSON:
{
  "should_intervene": true/false,
  "reason": "why",
  "message": "what to say (keep it brief, 1-2 sentences)",
  "trigger_type": "clarification_needed|question_suggested|term_explained|concern_detected"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        { role: 'user', content: 'Analyze the conversation and decide if intervention is needed.' }
      ]
    })

    const decision = JSON.parse(response.content[0].text)

    if (decision.should_intervene) {
      console.log(`AI intervening: ${decision.reason}`)

      // Generate speech with Cartesia
      await speakToConference(appointmentId, decision.message, ws)

      // Log intervention
      await supabase
        .from('assistant_interventions')
        .insert({
          appointment_id: appointmentId,
          trigger_type: decision.trigger_type,
          context_segment_id: segmentId,
          ai_response: decision.message
        })

      // Update appointment contribution count
      await supabase
        .from('appointments')
        .update({
          assistant_contributions: supabase.raw('assistant_contributions + 1')
        })
        .eq('id', appointmentId)
    }
  } catch (error) {
    console.error('AI intervention check error:', error)
  }
}

// ============================================================================
// CARTESIA TTS - SPEAK TO CONFERENCE
// ============================================================================

async function speakToConference(appointmentId, text, ws) {
  try {
    console.log(`AI speaking: "${text}"`)

    // Generate audio with Cartesia
    const response = await cartesia.tts.bytes({
      model_id: 'sonic-english',
      transcript: text,
      voice: {
        mode: 'id',
        id: 'a0e99841-438c-4a64-b679-ae501e7d6091' // Warm, professional female voice
      },
      output_format: {
        container: 'raw',
        encoding: 'pcm_mulaw', // Twilio format
        sample_rate: 8000
      }
    })

    // Get audio bytes
    const audioBytes = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBytes).toString('base64')

    // Stream to Twilio WebSocket
    const mediaMessage = {
      event: 'media',
      streamSid: ws.streamSid, // From initial connection
      media: {
        payload: base64Audio
      }
    }

    ws.send(JSON.stringify(mediaMessage))

    console.log('Audio sent to conference')
  } catch (error) {
    console.error('Error speaking to conference:', error)
  }
}

// ============================================================================
// HTTP SERVER UPGRADE FOR WEBSOCKET
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`Voice server running on port ${PORT}`)
})

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
})

// ============================================================================
// RECORDING CALLBACK
// ============================================================================

app.post('/api/recording/status', async (req, res) => {
  const { RecordingSid, RecordingUrl, CallSid } = req.body

  console.log(`Recording completed: ${RecordingSid}`)

  // Find appointment by conference SID and update
  // You'll need to store the mapping somewhere

  res.sendStatus(200)
})

export default app
