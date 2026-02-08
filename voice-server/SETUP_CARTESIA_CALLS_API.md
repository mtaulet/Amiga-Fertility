# Cartesia Calls API Integration Setup

Your agent is now deployed to Cartesia! This guide shows how to connect your Twilio conference calls to your deployed Cartesia agent.

## What Changed

### Before (Local Line Agent)
- Tried to run Line agent locally on port 8000
- Twilio bridge tried to connect via WebSocket
- Got 403 errors because Line doesn't work that way locally

### Now (Cartesia Calls API)
- Agent deployed to Cartesia cloud: `agent_zsSrTSnTBH8mtTpr17HDET`
- Twilio bridge connects via Cartesia Calls API
- Phone number: `+1(315)847-8049`

## Architecture

```
┌─────────────┐
│  Next.js    │
│  Frontend   │
└──────┬──────┘
       │ POST /api/appointments/create
       ▼
┌────────────────────────────────────────┐
│   Node.js Bridge (Port 3001)           │
│   cartesia-calls-bridge.js             │
│                                        │
│   - Manages Twilio conference          │
│   - Gets Cartesia access token         │
│   - Connects to Cartesia Calls API     │
└──────┬─────────────────────────────────┘
       │
       ├─── Twilio MediaStream ────▶ Doctor Phone
       │
       ├─── Twilio MediaStream ────▶ Patient Phone
       │
       └─── Cartesia Calls API ───▶ ┌──────────────────────┐
                                     │  Cartesia Cloud      │
                                     │                      │
                                     │  Your Deployed Agent │
                                     │  - STT (Ink)         │
                                     │  - Claude AI         │
                                     │  - TTS (Sonic)       │
                                     └──────────────────────┘
```

## Setup Steps

### 1. Get Your Cartesia API Key

1. Go to [play.cartesia.ai/keys](https://play.cartesia.ai/keys)
2. Click "Create API Key"
3. Copy the key (starts with `sk-...`)

### 2. Update Environment Variables

Edit `voice-server/.env`:

```bash
# ====================
# CARTESIA CALLS API - ✅ REQUIRED
# ====================
CARTESIA_API_KEY=sk-your-actual-key-here  # ← Paste your key here
CARTESIA_AGENT_ID=agent_zsSrTSnTBH8mtTpr17HDET
```

### 3. Test the Bridge

**Terminal 1: Start the bridge**
```bash
cd /Users/marta/source/amiga-fertility/voice-server
nvm use 22  # Use Node 22
npm run dev
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║  Amiga Voice Server - Twilio ↔ Cartesia Calls API         ║
╚════════════════════════════════════════════════════════════╝

Configuration:
- Twilio Account: TWILIO_ACCOUNT_SID_HERE
- Twilio Phone: +1234567890
- Cartesia Agent: agent_zsSrTSnTBH8mtTpr17HDET
- Database: Supabase connected

✅ Server running on port 3001
```

**Terminal 2: Start Next.js**
```bash
cd /Users/marta/source/amiga-fertility
nvm use 22  # Use Node 22
npm run dev
```

### 4. Make a Test Call

1. Open http://localhost:3000/appointments/start
2. Fill in:
   - **Doctor Name**: Test Doctor
   - **Doctor Phone**: Your phone number
   - **Patient Phone**: Another phone number (or voicemail)
3. Click "Start AI-Assisted Appointment"
4. Answer the calls
5. Have a conversation with medical terms
6. Listen for Amiga to intervene!

## How It Works

### Call Flow

1. **User clicks "Start" in Next.js**
   - Creates appointment in Supabase
   - Calls bridge endpoint: `POST /api/appointments/{id}/start-call`

2. **Bridge initiates Twilio calls**
   - Calls doctor
   - Calls patient (3 sec delay)
   - Both join same Twilio conference

3. **Bridge connects to Cartesia**
   - Gets access token from Cartesia API
   - Opens WebSocket to `wss://api.cartesia.ai/agents/stream/{agent_id}`
   - Sends `start` event with configuration

4. **Audio streaming begins**
   - Twilio → Bridge → Cartesia (doctor/patient speech)
   - Cartesia → Bridge → Twilio (AI assistant speech)

5. **Cartesia processes**
   - **STT**: Converts speech to text
   - **Claude AI**: Decides if/when to intervene
   - **TTS**: Generates natural speech
   - Streams audio back to conference

6. **Everyone hears the AI**
   - Doctor hears AI
   - Patient hears AI
   - AI hears both doctor and patient

## API Endpoints

### Bridge Server (Port 3001)

- `GET /` - Health check
- `POST /api/appointments/:id/start-call` - Start a call
  - Body: `{ doctorPhone: "+1234...", patientPhone: "+1234..." }`
- `POST /twiml/conference/:id` - TwiML for conference
- `POST /webhooks/conference-status` - Conference events
- `POST /webhooks/call-status` - Call events
- `WS /media-stream/:id` - Audio streaming (Twilio MediaStream)

### Cartesia Calls API

- `POST https://api.cartesia.ai/agents/access-token` - Get access token
- `WSS wss://api.cartesia.ai/agents/stream/{agent_id}` - Audio streaming

## Debugging

### Check Cartesia Connection

The bridge logs will show:
```
🎙️  MediaStream connected: doctor (appointment-123)
   Getting Cartesia access token...
   Connecting to Cartesia agent...
✅ Connected to Cartesia agent
   Cartesia stream initialized: stream-abc123
```

### Common Issues

**"Failed to get access token"**
- Check `CARTESIA_API_KEY` in `.env`
- Verify key at https://play.cartesia.ai/keys

**"Authorization failed"**
- API key might be expired
- Check Cartesia dashboard for active keys

**"Agent not found"**
- Verify `CARTESIA_AGENT_ID` matches your deployed agent
- Check agent status in Cartesia dashboard

**No audio from AI**
- Check Cartesia dashboard → Calls tab for active calls
- Verify agent is "Ready" in Deployment tab
- Check `ANTHROPIC_API_KEY` is set in Cartesia env vars

## Update Your Agent

To update the agent's behavior:

### Option 1: Update via Dashboard
1. Go to Cartesia dashboard → Your agent → Configuration
2. Edit system prompt or introduction
3. Changes apply immediately to new calls

### Option 2: Redeploy from Code
```bash
cd /Users/marta/source/amiga-fertility/voice-server/cartesia-agent
# Edit main.py or agent.py
cartesia deploy
```

The new version will be deployed and become active.

## Environment Variables Summary

### Next.js App (`.env.local`)
```bash
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_AUTH0_DOMAIN.auth0.com
AUTH0_CLIENT_ID=YFde6mUZQjNDqxxGNe5KTqrIxY379HDo
AUTH0_CLIENT_SECRET=...
AUTH0_SECRET=...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_VOICE_SERVER_URL=http://localhost:3001
```

### Voice Server Bridge (`voice-server/.env`)
```bash
# Twilio
TWILIO_ACCOUNT_SID=TWILIO_ACCOUNT_SID_HERE
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Cartesia
CARTESIA_API_KEY=sk-...  # ← GET THIS FROM play.cartesia.ai/keys
CARTESIA_AGENT_ID=agent_zsSrTSnTBH8mtTpr17HDET

# Server
PORT=3001
BASE_URL=https://your-ngrok-url.ngrok-free.dev  # For production
```

### Cartesia Agent (Encrypted on Cartesia)
```bash
# Set via: cartesia env set KEY=VALUE
ANTHROPIC_API_KEY=sk-ant-api03-...
CARTESIA_API_KEY=sk-...  # For agent's TTS/STT
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

## Cost Per Call

Estimated cost for a 30-minute consultation:

- **Twilio**: $0.85 (2 phone calls × 30 min)
- **Cartesia Line**: ~$0.50 (STT + TTS + hosting)
- **Claude Sonnet 4.5**: ~$0.30 (AI reasoning)
- **Total**: ~$1.65 per call

## Next Steps

1. ✅ Get Cartesia API key
2. ✅ Add to `voice-server/.env`
3. ✅ Test with a call
4. ✅ Review transcripts in Supabase
5. Customize agent behavior in Cartesia dashboard
6. Deploy to production (ngrok or cloud hosting)

## Production Deployment

When ready for production:

1. **Deploy bridge to cloud**
   - Fly.io, Railway, or Render
   - Update `BASE_URL` in `.env`

2. **Update Twilio webhook URLs**
   - Point to your production `BASE_URL`

3. **Keep agent deployed on Cartesia**
   - Already done! No changes needed

4. **Monitor calls**
   - Cartesia dashboard → Calls & Metrics tabs
   - Supabase → Check appointment logs

---

**You're all set!** 🚀 Your AI assistant is ready to join fertility consultations!
