# Quick Start: Real-Time AI Assistant

Get your AI-assisted appointments up and running in 30 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Phone numbers to test with

## Step-by-Step Setup

### 1. Get API Keys (15 mins)

#### Twilio (Required)
1. Go to https://www.twilio.com/try-twilio
2. Sign up (get $15 free credit)
3. Get a phone number with **Voice** capabilities
4. Copy from console:
   - Account SID
   - Auth Token
   - Your Twilio phone number

#### Deepgram (Required)
1. Go to https://deepgram.com
2. Sign up (get $200 free credit)
3. Go to API Keys → Create New Key
4. Copy the API key

#### Anthropic Claude (Required)
1. Go to https://console.anthropic.com
2. Sign up
3. Go to API Keys → Create Key
4. Copy the API key
5. Add credits to your account

#### Cartesia (Required)
1. Go to https://cartesia.ai
2. Sign up for beta access
3. Get API key from dashboard
4. Copy the API key

### 2. Setup Voice Server (5 mins)

```bash
# Navigate to voice server directory
cd /Users/marta/source/amiga-fertility/voice-server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
nano .env
```

Fill in:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

ANTHROPIC_API_KEY=sk-ant-xxx
CARTESIA_API_KEY=your_cartesia_key
DEEPGRAM_API_KEY=your_deepgram_key

PORT=3001
```

### 3. Run Database Migration (2 mins)

1. Open Supabase SQL Editor
2. Copy and paste from: `../supabase/migrations/006_appointments_with_live_assistant.sql`
3. Click "Run"
4. Verify tables created: `appointments`, `conversation_segments`, `assistant_interventions`

### 4. Configure Next.js App (1 min)

Add to `/Users/marta/source/amiga-fertility/.env.local`:

```bash
NEXT_PUBLIC_VOICE_SERVER_URL=http://localhost:3001
```

### 5. Start Everything! (2 mins)

**Terminal 1 - Voice Server:**
```bash
cd voice-server
npm run dev
```

You should see:
```
Voice server running on port 3001
```

**Terminal 2 - Next.js App:**
```bash
cd ..
npm run dev
```

You should see:
```
▲ Next.js 16.1.6
- Local: http://localhost:3000
```

### 6. Test It! (5 mins)

1. Open browser: http://localhost:3000
2. Sign in to your account
3. Go to: http://localhost:3000/appointments/start
4. Fill in:
   - Doctor Name: "Test Doctor"
   - Doctor Phone: YOUR_PHONE_NUMBER
   - Patient Phone: ANOTHER_PHONE_NUMBER (friend/family)
5. Click "Start AI-Assisted Appointment"
6. Wait for calls!

**What should happen:**
1. Both phones ring within ~10 seconds
2. Doctor answers: Hears "Connecting you to appointment..."
3. Patient answers: Hears "Connecting you to your doctor..."
4. Conference starts - both can talk
5. AI is listening (silent at first)
6. Try saying complex medical terms - AI may chime in!

## Testing the AI

### Test Scenario 1: Medical Term
```
Doctor: "Your AMH levels are quite low"
[Wait 2-3 seconds]
AI should say: "AMH stands for Anti-Müllerian Hormone..."
```

### Test Scenario 2: Patient Question
```
Patient: "How does IVF work?"
Doctor: "We'll discuss that later"
[Wait 2-3 seconds]
AI might say: "Would it be helpful to briefly explain the IVF process now?"
```

### Test Scenario 3: Emotional Support
```
Patient: [upset tone] "I'm really worried this won't work"
[Wait 2-3 seconds]
AI should provide: "It's completely normal to feel worried..."
```

## Troubleshooting

### Calls aren't connecting
- ✅ Check Twilio phone number is correct (+1...)
- ✅ Verify Twilio Account SID and Auth Token
- ✅ Check voice server is running (port 3001)
- ✅ Look at voice server logs for errors

### No transcription appearing
- ✅ Check Deepgram API key is valid
- ✅ Look for "Deepgram error" in voice server logs
- ✅ Verify WebSocket connection established

### AI not speaking
- ✅ Check Claude API key is valid
- ✅ Verify Cartesia API key is valid
- ✅ Check voice server logs for "AI intervening"
- ✅ Try saying more medical terms

### "Cannot connect to voice server"
- ✅ Is voice server running? (`npm run dev` in voice-server/)
- ✅ Check NEXT_PUBLIC_VOICE_SERVER_URL in .env.local
- ✅ Port 3001 not blocked by firewall

## What to Check After First Call

1. **Supabase Database:**
   ```sql
   SELECT * FROM appointments ORDER BY created_at DESC LIMIT 1;
   -- Should show your appointment with status 'completed'

   SELECT * FROM conversation_segments WHERE appointment_id = 'YOUR_APPOINTMENT_ID';
   -- Should show transcript segments

   SELECT * FROM assistant_interventions WHERE appointment_id = 'YOUR_APPOINTMENT_ID';
   -- Should show AI contributions (if any)
   ```

2. **Voice Server Logs:**
   - Should see WebSocket connection messages
   - Transcription events from Deepgram
   - AI intervention decisions
   - Cartesia TTS calls

3. **Costs Incurred:**
   - Twilio: ~$0.01 per minute per participant
   - Deepgram: ~$0.0125 per minute
   - Claude: ~$0.01 for analysis
   - Cartesia: ~$0.01 for speech
   - **Total: ~$0.50 for 10-minute test call**

## Next Steps

Once working:

1. **Customize AI Behavior:**
   - Edit intervention logic in `index.js`
   - Adjust Claude system prompt
   - Change voice (Cartesia voice IDs)

2. **Add More Features:**
   - Patient dashboard to view transcripts
   - Call history page
   - AI intervention ratings
   - Export transcript to PDF

3. **Deploy to Production:**
   - Deploy voice server (Railway/Render)
   - Configure webhooks with public URLs
   - Enable HIPAA on all services
   - Set up monitoring

## Production Checklist

Before going live with real patients:

- [ ] Get BAAs from Twilio, Deepgram, Claude, Cartesia
- [ ] Enable HIPAA mode on Supabase
- [ ] Deploy voice server to production
- [ ] Configure Twilio webhooks with production URLs
- [ ] Test with multiple concurrent calls
- [ ] Set up error monitoring (Sentry)
- [ ] Create patient consent flow
- [ ] Test data retention/deletion
- [ ] Perform security audit
- [ ] Get legal review of AI interventions

## Support

Having issues? Check:

1. **Voice server logs** - most errors show here
2. **Twilio debugger** - https://console.twilio.com/debugger
3. **Supabase logs** - Check for database errors
4. **Browser console** - Next.js client errors

## Cost Optimization

To reduce costs during testing:

- Use shorter test calls (5 mins vs 30)
- Reduce AI intervention frequency
- Use Cartesia's cheaper voice models
- Cache common responses
- Batch process non-real-time analysis

## Example Voice Server Logs

Successful call:
```
Voice server running on port 3001
WebSocket connection established
Stream started for appointment: abc-123
[doctor] Let's discuss your treatment options (final: true)
[patient] Ok, what are my options? (final: true)
AI intervening: clarification_needed
AI speaking: "Let me help clarify the treatment options..."
Audio sent to conference
WebSocket connection closed
```

Enjoy your AI assistant! 🎉
