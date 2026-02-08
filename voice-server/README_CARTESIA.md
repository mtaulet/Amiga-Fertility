# Amiga Fertility - AI Voice Assistant (Cartesia Line)

## 🎯 What This Does

An AI assistant that **listens to live doctor-patient fertility consultations** and intervenes when helpful to:
- Clarify medical terminology
- Provide emotional support
- Suggest questions
- Emphasize important information

## 🏗️ Architecture

```
┌──────────────┐
│   Next.js    │  Patient clicks "Start Appointment"
│   Frontend   │
└──────┬───────┘
       │
       ↓ HTTP POST
┌─────────────────────────────────┐
│   Node.js Twilio Bridge         │  Manages phone calls
│   (twilio-bridge.js)            │  Streams audio
│   Port 3001                     │
└──────┬──────────────────┬───────┘
       │                  │
       ↓                  ↓
  ┌─────────┐      ┌──────────────────┐
  │ Twilio  │      │  Cartesia Line   │  All-in-one AI
  │ Calls   │      │  Python Agent    │  - Transcription
  └─────────┘      │  Port 8000       │  - Claude AI
                   │                  │  - Voice synthesis
                   └──────────────────┘
                           │
                           ↓
                   ┌──────────────┐
                   │   Supabase   │  Stores everything
                   │   Database   │
                   └──────────────┘
```

## 📁 Project Structure

```
voice-server/
├── twilio-bridge.js          # Node.js bridge (Twilio ↔ Cartesia)
├── package.json              # Node dependencies
├── .env                      # Node configuration
│
├── cartesia-agent/           # Python AI agent
│   ├── agent.py              # Main agent code
│   ├── .env                  # Python configuration
│   ├── requirements.txt      # Python dependencies
│   ├── start.sh              # Startup script
│   └── README.md             # Agent documentation
│
├── setup-twilio.js           # Helper: Find phone numbers
├── buy-twilio-number.js      # Helper: Purchase numbers
│
└── Documentation/
    ├── README_CARTESIA.md    # This file (overview)
    ├── QUICK_START.md        # 10-min setup guide
    ├── CARTESIA_LINE_SETUP.md # Detailed architecture
    ├── START_HERE.md         # Original setup (deprecated)
    └── Other guides...
```

## ✅ What's Complete

- ✅ Twilio account configured (phone: +1234567890)
- ✅ Python Cartesia Line agent built
- ✅ Node.js Twilio bridge built
- ✅ Database schema ready
- ✅ Next.js UI ready
- ✅ All dependencies installed
- ✅ Complete documentation

## ❌ What's Missing

You need **2 API keys**:

### 1. Anthropic Claude (~$20)
- Sign up: https://console.anthropic.com
- Add $20 minimum credits
- Create API key
- Add to: `cartesia-agent/.env`

### 2. Cartesia (Free trial)
- Sign up: https://cartesia.ai
- Get API key
- Add to: `cartesia-agent/.env`

### 3. Supabase (You have it!)
- Copy URL and Service Role Key
- Add to BOTH `.env` files

## 🚀 How to Start

### Step 1: Configure API Keys

Edit **two `.env` files**:

#### `voice-server/.env` (Node.js)
```bash
TWILIO_ACCOUNT_SID=TWILIO_ACCOUNT_SID_HERE
TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN_HERE
TWILIO_PHONE_NUMBER=+1234567890

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

PORT=3001
BASE_URL=http://localhost:3001
CARTESIA_AGENT_URL=ws://localhost:8000
```

#### `cartesia-agent/.env` (Python)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
CARTESIA_API_KEY=...

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

PORT=8000
```

### Step 2: Run Services

**Terminal 1: Python Agent**
```bash
cd voice-server
npm run agent
```
Wait for: `Starting agent on port 8000...`

**Terminal 2: Node Bridge**
```bash
cd voice-server
npm run dev
```
Wait for: `✅ Server running on port 3001`

**Terminal 3: Next.js**
```bash
cd /Users/marta/source/amiga-fertility
npm run dev
```
Wait for: `Ready on http://localhost:3000`

### Step 3: Test

1. Open: http://localhost:3000/appointments/start
2. Enter two phone numbers
3. Click "Start AI-Assisted Appointment"
4. Answer both calls
5. Have a conversation with medical terms
6. Listen for AI intervention! 🎉

## 🎙️ How a Call Works

1. **User starts appointment** (Next.js UI)
2. **Node bridge calls Twilio**
   - Calls doctor phone
   - Calls patient phone
   - Connects both to conference
3. **Audio streams to Python agent**
   - Twilio → WebSocket → Bridge → Agent
4. **Agent processes in real-time**
   - Transcribes speech (built-in STT)
   - Claude analyzes conversation
   - Decides: Should I speak?
   - Generates voice response (built-in TTS)
5. **AI speaks to everyone**
   - Agent → Bridge → Twilio → Conference
   - Doctor and patient hear AI
6. **Everything logged**
   - Transcripts saved to Supabase
   - Interventions tracked
   - Call metadata stored

## 💰 Cost Per Call (30 min)

- Twilio: $0.85 (phone)
- Cartesia Line: ~$0.50 (STT + TTS)
- Claude: ~$0.30 (AI)
- **Total: ~$1.65**

First calls are free with trial credits!

## 📚 Documentation

| File | Purpose |
|------|---------|
| **QUICK_START.md** | Get running in 10 minutes |
| **CARTESIA_LINE_SETUP.md** | Complete technical guide |
| **cartesia-agent/README.md** | Python agent details |
| START_HERE.md | Original architecture (deprecated) |

## 🔧 Commands

```bash
# Start Python agent
npm run agent

# Start Node bridge (development)
npm run dev

# Start Node bridge (production)
npm start

# Find available Twilio numbers
node setup-twilio.js

# Buy a Twilio number
node buy-twilio-number.js "+1234567890"
```

## 🐛 Troubleshooting

### Agent won't start
```bash
pip3 install cartesia-line python-dotenv supabase fastapi uvicorn websockets
```

### Bridge can't connect
- Make sure Python agent is running first
- Check logs for "Starting agent on port 8000"

### No audio streaming
- Both services running?
- Check WebSocket connections in logs
- Verify TwiML includes `<Stream>` tag

### AI not speaking
- Check API keys in `cartesia-agent/.env`
- Verify Claude has credits
- AI might be correctly staying quiet

### Database errors
- Check Supabase keys in BOTH `.env` files
- Run migration: `006_appointments_with_live_assistant.sql`
- Check Supabase logs

## 🎯 Next Steps

1. ✅ Get Anthropic API key
2. ✅ Get Cartesia API key
3. ✅ Add Supabase credentials to both `.env` files
4. ✅ Start all three services
5. ✅ Make your first test call
6. ✅ Review transcript in database
7. ✅ Customize AI behavior (edit `agent.py`)
8. ✅ Deploy to production

## 🚀 Production Deployment

When ready:

1. **Deploy Python agent** to cloud (AWS/GCP/Railway)
2. **Deploy Node bridge** to Vercel/Fly.io
3. **Update URLs** in `.env` files
4. **Enable HTTPS** (required)
5. **Set up monitoring**
6. **Get BAAs** from all services (HIPAA)

## 💡 Tips

- **Test locally first** - Make 3-5 test calls
- **Review transcripts** - Check Supabase for accuracy
- **Tune AI behavior** - Edit system prompt in `agent.py`
- **Monitor costs** - Track usage in each dashboard
- **Start simple** - Add complexity as you learn

## 📞 Support

- **Cartesia Line**: https://docs.cartesia.ai/line
- **Twilio**: https://www.twilio.com/docs/voice
- **Claude**: https://docs.anthropic.com
- **Your docs**: Check other .md files in this directory

---

**Ready to transform fertility consultations with AI!** 🎉💜

Questions? Check **QUICK_START.md** for step-by-step instructions.
