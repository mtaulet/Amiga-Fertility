# Amiga Voice Server - Real-Time AI Assistant

## Overview

This server enables **real-time AI participation** in doctor-patient conversations. The AI assistant (Amiga) listens to live appointments and can intervene to:

- Clarify complex medical terms
- Suggest questions patients should ask
- Provide emotional support
- Take automated notes
- Ensure nothing important is missed

## Architecture

```
Doctor + Patient + AI Assistant → Twilio Conference Call
                                          ↓
                                   Audio Stream (WebSocket)
                                          ↓
                                   Voice Server
                                          ↓
                    ┌─────────────────┬───────────────┬──────────────┐
                    ↓                 ↓               ↓              ↓
                Deepgram STT      Claude AI      Cartesia TTS   Supabase DB
              (transcribe)       (analyze)        (speak)        (store)
```

## Setup

### 1. Install Dependencies

```bash
cd voice-server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required API keys:
- **Twilio**: Account SID, Auth Token, Phone Number
  - Sign up: https://www.twilio.com/try-twilio
  - Buy a phone number with Voice capabilities
  - Enable HIPAA for production ($$$)

- **Deepgram**: API Key
  - Sign up: https://deepgram.com
  - Get API key from console
  - Medical vocabulary support included

- **Anthropic Claude**: API Key
  - Sign up: https://console.anthropic.com
  - Create API key
  - Get BAA for HIPAA compliance

- **Cartesia**: API Key
  - Sign up: https://cartesia.ai
  - Get API key for voice synthesis
  - Verify HIPAA compliance/BAA

- **Supabase**: URL + Service Role Key
  - From your Supabase project dashboard

### 3. Run Database Migrations

In Supabase SQL Editor, run:
```sql
-- /Users/marta/source/amiga-fertility/supabase/migrations/006_appointments_with_live_assistant.sql
```

### 4. Start the Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`

### 5. Configure Next.js App

Add to `/Users/marta/source/amiga-fertility/.env.local`:

```bash
NEXT_PUBLIC_VOICE_SERVER_URL=http://localhost:3001
```

For production, use your deployed voice server URL (e.g., Railway, Render, Fly.io)

## Usage

### Starting an AI-Assisted Appointment

1. Navigate to: `http://localhost:3000/appointments/start`
2. Enter:
   - Doctor's name
   - Doctor's phone number (+1234567890)
   - Patient's phone number
   - Appointment type
3. Click "Start AI-Assisted Appointment"
4. Both doctor and patient will receive calls
5. AI assistant joins automatically

### How the AI Intervenes

The AI listens to the conversation and decides when to speak based on:

**Intervention Triggers:**
- ✅ Doctor uses complex medical terminology
- ✅ Patient seems confused or hesitant
- ✅ Important information that needs emphasis
- ✅ Patient question wasn't fully answered
- ✅ Emotional support opportunity

**Won't Intervene When:**
- ❌ Conversation flowing naturally
- ❌ Topic adequately covered
- ❌ Would interrupt important moment

### Example Interventions

**Scenario 1: Medical Term**
```
Doctor: "Your AMH levels indicate diminished ovarian reserve..."
AI: "Just to clarify, AMH is Anti-Müllerian Hormone, which helps
     measure your egg supply. Would you like me to explain more?"
```

**Scenario 2: Missed Question**
```
Patient: "So, um, how long would treatment take?"
Doctor: "We'll discuss that next week."
AI: "I noticed you asked about timeline. Doctor, would you be
     able to give a rough estimate now?"
```

**Scenario 3: Emotional Support**
```
Patient: [sounds upset] "This is just so overwhelming..."
AI: "It's completely normal to feel this way. Many patients feel
     overwhelmed at first. Would it help to break things down step by step?"
```

## API Endpoints

### Start Conference Call
```
POST /api/appointments/:appointmentId/start-call

Body:
{
  "doctorPhone": "+1234567890",
  "patientPhone": "+1987654321"
}

Response:
{
  "success": true,
  "conferenceName": "appointment-{id}",
  "doctorCallSid": "CA...",
  "patientCallSid": "CA..."
}
```

### Conference Status Webhook
```
POST /api/conference/status

Twilio automatically posts:
- conference-start
- conference-end
- participant-join
- participant-leave
```

### Recording Status Webhook
```
POST /api/recording/status

Twilio posts when recording is ready:
{
  "RecordingSid": "RE...",
  "RecordingUrl": "https://..."
}
```

## Viewing Transcripts

After an appointment, patients can:

1. View real-time transcript (appears during call)
2. See AI interventions highlighted
3. Review full conversation history
4. Ask follow-up questions to voice agent

## Cost Estimates

Per 30-minute appointment:

| Service | Cost |
|---------|------|
| Twilio (3 participants × 30 min) | ~$1.17 |
| Deepgram transcription | ~$0.38 |
| Claude API (processing) | ~$0.15 |
| Cartesia TTS (AI responses) | ~$0.05 |
| **Total** | **~$1.75/appointment** |

## Production Deployment

### Recommended Stack:
- **Voice Server**: Railway / Render / Fly.io
- **Next.js App**: Vercel
- **Database**: Supabase (HIPAA tier)

### Security Checklist:
- [ ] Enable HIPAA on all services (get BAAs)
- [ ] Use HTTPS/WSS only
- [ ] Encrypt recordings at rest
- [ ] Implement audit logging
- [ ] Set up access controls
- [ ] Configure retention policies
- [ ] Test consent workflow

### Scaling Considerations:
- WebSocket connections: ~1 per active appointment
- CPU: Moderate (mostly I/O bound)
- Memory: ~100MB per active conversation
- Bandwidth: ~64kbps per audio stream

For 10 concurrent appointments:
- 30 WebSocket connections (doctor + patient + AI each)
- ~2GB RAM
- ~2Mbps bandwidth

## Monitoring

Track:
- Active conferences
- AI intervention rate
- Transcription accuracy
- API latencies (Deepgram, Claude, Cartesia)
- Patient satisfaction with AI assistance

## Troubleshooting

### "WebSocket connection failed"
- Check voice server is running
- Verify WebSocket upgrade path
- Check firewall/proxy settings

### "No audio streaming"
- Verify Twilio webhook URLs are correct
- Check phone numbers have +country code
- Test with Twilio console debugger

### "AI not intervening"
- Check Claude API key
- Review conversation context in logs
- Adjust intervention criteria in code

### "Poor transcription quality"
- Verify audio quality
- Check Deepgram model settings
- Enable noise suppression

## Development

### Testing Locally

1. Use ngrok to expose localhost:
```bash
ngrok http 3001
```

2. Update Twilio webhook URLs to ngrok URL

3. Test with your phone numbers

### Adding Custom Intervention Logic

Edit `checkForAIIntervention()` in `index.js`:

```javascript
// Custom trigger example
if (recentContext.some(c =>
  c.speaker === 'patient' &&
  c.text.toLowerCase().includes('cost')
)) {
  // Trigger cost discussion intervention
}
```

## Support

For issues or questions:
- Check logs: `npm run dev` (shows all WebSocket activity)
- Test endpoints: Use Postman/curl
- Twilio debugging: https://console.twilio.com/debugger

## License

Proprietary - Amiga Fertility
