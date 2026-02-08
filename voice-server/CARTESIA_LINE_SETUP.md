# Cartesia Line Integration - Setup Guide

## Architecture Overview

The Amiga Fertility voice assistant now uses **Cartesia Line**, a unified platform that handles STT (Speech-to-Text), AI reasoning, and TTS (Text-to-Speech) in one integrated system.

```
┌─────────────────┐
│   Next.js App   │  ← Your frontend (unchanged)
└────────┬────────┘
         │
         ↓ POST /api/appointments/create
┌──────────────────────────────────────────────────┐
│         Node.js Twilio Bridge (Port 3001)        │
│  - Receives Twilio MediaStreams                  │
│  - Forwards audio to Cartesia Line agent         │
│  - Logs to Supabase                              │
└────────┬─────────────────────────────────┬───────┘
         │                                 │
         ↓ WebSocket audio                 ↓ WebSocket audio
   ┌──────────┐                      ┌──────────────────┐
   │  Twilio  │                      │  Cartesia Line   │
   │  Calls   │                      │  Python Agent    │
   │          │                      │  (Port 8000)     │
   └──────────┘                      │                  │
                                     │  - STT built-in  │
                                     │  - Claude AI     │
                                     │  - TTS built-in  │
                                     └──────────────────┘
```

## What Changed

### Before (Multi-Service):
- **Deepgram**: Speech-to-text
- **Claude API**: AI decision-making
- **Cartesia TTS**: Text-to-speech
- **Complex orchestration**: Voice server managed all 3 services

### Now (Cartesia Line):
- **Cartesia Line Agent**: All-in-one (STT + AI + TTS)
- **Simpler architecture**: Python agent handles conversation
- **Node.js bridge**: Just routes audio between Twilio and agent

## Components

### 1. Python Cartesia Line Agent (`cartesia-agent/`)

**File**: `agent.py`

The AI assistant that:
- Listens to doctor-patient conversations
- Uses Claude Sonnet 4.5 for reasoning
- Decides when to intervene
- Speaks naturally using Cartesia's TTS
- Logs to Supabase

**Start**: `./cartesia-agent/start.sh` or `npm run agent`

### 2. Node.js Twilio Bridge (`twilio-bridge.js`)

The bridge server that:
- Receives API calls from Next.js
- Initiates Twilio conference calls
- Streams audio between Twilio ↔ Cartesia Line
- Handles webhooks
- Logs call metadata

**Start**: `npm run dev` or `npm start`

## Setup Steps

### 1. Install Python Dependencies

The agent requires Python 3.11+ (already installed at `/usr/local/opt/python@3.11`).

Dependencies are already installed:
- `cartesia-line` - The Line SDK
- `python-dotenv` - Environment variables
- `supabase` - Database client
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `websockets` - WebSocket support

### 2. Configure Environment Variables

Two `.env` files are needed:

#### A. Node.js Bridge: `voice-server/.env`

```bash
# Twilio
TWILIO_ACCOUNT_SID=TWILIO_ACCOUNT_SID_HERE
TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN_HERE
TWILIO_PHONE_NUMBER=+1234567890

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server
PORT=3001
BASE_URL=http://localhost:3001

# Cartesia Agent
CARTESIA_AGENT_URL=ws://localhost:8000
```

#### B. Python Agent: `cartesia-agent/.env`

```bash
# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cartesia
CARTESIA_API_KEY=your_cartesia_api_key_here

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Agent Config
PORT=8000
```

### 3. Get Remaining API Keys

You still need:

#### **Anthropic Claude** (Required)
- Sign up: https://console.anthropic.com
- Add $20 minimum credits
- Create API key
- Paste into `cartesia-agent/.env` → `ANTHROPIC_API_KEY`

#### **Cartesia** (Required)
- Sign up: https://cartesia.ai
- Get API key from dashboard
- Paste into `cartesia-agent/.env` → `CARTESIA_API_KEY`

#### **Supabase** (You already have)
- Copy URL and Service Role Key from your existing project
- Add to both `.env` files

### 4. Run the System

You need to start **both services** in separate terminals:

#### Terminal 1: Python Agent

```bash
cd /Users/marta/source/amiga-fertility/voice-server
npm run agent
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║  Amiga Fertility AI Assistant - Cartesia Line Agent       ║
╚════════════════════════════════════════════════════════════╝

Starting agent on port 8000...
```

#### Terminal 2: Node.js Bridge

```bash
cd /Users/marta/source/amiga-fertility/voice-server
npm run dev
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║  Amiga Voice Server - Twilio ↔ Cartesia Line Bridge       ║
╚════════════════════════════════════════════════════════════╝

✅ Server running on port 3001
```

#### Terminal 3: Next.js App

```bash
cd /Users/marta/source/amiga-fertility
npm run dev
```

### 5. Test the System

1. Open browser: http://localhost:3000/appointments/start
2. Fill in:
   - Doctor phone: Your phone number
   - Patient phone: Another phone number
3. Click "Start AI-Assisted Appointment"
4. Answer both calls
5. Have a test conversation with medical terms
6. Listen for the AI to intervene!

## How It Works

### Call Flow

1. **User clicks "Start" in Next.js**
   - POST request to `/api/appointments/create`
   - Next.js saves appointment to Supabase
   - POST request to Node bridge `/api/appointments/{id}/start-call`

2. **Node bridge initiates Twilio calls**
   - Calls doctor phone
   - Calls patient phone (3 sec delay)
   - Both connect to same conference

3. **Twilio streams audio**
   - Each participant's audio → WebSocket to Node bridge
   - Node bridge → WebSocket to Cartesia Line agent

4. **Cartesia Line agent processes**
   - **STT**: Converts speech to text (built-in)
   - **AI**: Claude analyzes conversation
   - **Decision**: Should the AI speak?
   - **TTS**: Generates speech (built-in)
   - Streams audio back to Node bridge

5. **Node bridge returns audio**
   - Receives AI audio from Cartesia
   - Sends to Twilio conference
   - Everyone hears the AI assistant!

6. **Database logging**
   - Node bridge logs call metadata
   - Python agent logs transcripts & interventions
   - Everything saved to Supabase

## API Endpoints

### Node Bridge (Port 3001)

- `GET /` - Health check
- `POST /api/appointments/:id/start-call` - Start a call
- `POST /twiml/conference/:id` - TwiML for conference
- `POST /webhooks/conference-status` - Conference events
- `POST /webhooks/call-status` - Call events
- `WS /media-stream/:id` - Audio streaming

### Python Agent (Port 8000)

- Managed by Cartesia Line (auto-configured)
- WebSocket endpoint for audio streaming
- Internal API for agent management

## Troubleshooting

### Agent Won't Start

**Error**: `ModuleNotFoundError: No module named 'line'`

**Fix**: Dependencies not installed. Run:
```bash
pip3 install cartesia-line python-dotenv supabase fastapi uvicorn websockets
```

### Bridge Can't Connect to Agent

**Error**: `Failed to connect to Cartesia`

**Fix**: Make sure Python agent is running first:
```bash
cd voice-server
npm run agent
```

Wait for "Starting agent on port 8000..." before starting bridge.

### No Audio Streaming

**Check**:
1. Both services running? (agent + bridge)
2. WebSocket connection established? (check logs)
3. Twilio MediaStream enabled in TwiML?

### AI Not Speaking

**Check**:
1. Anthropic API key set in `cartesia-agent/.env`?
2. Cartesia API key set?
3. Agent logs showing conversation?
4. AI might be correctly staying quiet if intervention not needed

### Database Not Logging

**Check**:
1. Supabase keys in both `.env` files?
2. Migration `006_appointments_with_live_assistant.sql` run?
3. Check Supabase logs for errors

## Cost Per Call (30 min)

With Cartesia Line unified platform:

- **Twilio**: $0.85 (phone minutes)
- **Cartesia Line**: ~$0.50 (STT + TTS combined)
- **Claude**: ~$0.30 (AI reasoning)
- **Total**: ~$1.65 per call

**Savings**: ~$0.10 per call vs multi-service architecture!

## Next Steps

1. ✅ Get Anthropic API key
2. ✅ Get Cartesia API key
3. ✅ Configure both `.env` files
4. ✅ Test with first call
5. ✅ Review transcripts in database
6. ✅ Customize AI intervention logic
7. ✅ Deploy to production

## Production Deployment

When ready for production:

1. **Deploy Python agent** to a cloud server (AWS/GCP/Digital Ocean)
2. **Deploy Node bridge** to Vercel/Railway/Fly.io
3. **Update `BASE_URL`** in `.env` to production URL
4. **Update `CARTESIA_AGENT_URL`** to agent's production URL
5. **Enable HTTPS** (required for production)
6. **Set up monitoring** for both services

## Support

- **Cartesia Line Docs**: https://docs.cartesia.ai/line
- **Twilio Docs**: https://www.twilio.com/docs/voice
- **Your Setup Guides**: Check other MD files in voice-server/

---

**You're building something incredible!** 🚀💜
