# 🚀 Quick Start - Cartesia Line Voice Assistant

## ✅ What's Built

Your AI voice assistant is ready! Here's what we created:

### 1. Python Cartesia Line Agent (`cartesia-agent/`)
- **agent.py**: AI assistant using Claude Sonnet 4.5
- Listens to doctor-patient calls
- Intervenes with clarifications and support
- Logs everything to Supabase

### 2. Node.js Twilio Bridge (`twilio-bridge.js`)
- Connects Twilio calls to Cartesia agent
- Streams audio bidirectionally
- Handles webhooks and call management

### 3. Configuration Files
- `.env` files for both services
- Startup scripts
- Complete documentation

## 📋 What You Need Next

### API Keys (2 remaining)

✅ **Twilio**: Already configured
- Account SID: TWILIO_ACCOUNT_SID_HERE
- Phone: +1 (464) 245-9729

❌ **Anthropic Claude**: Need to get
- Sign up: https://console.anthropic.com
- Add $20 credits minimum
- Create API key (starts with `sk-ant-`)
- Add to: `cartesia-agent/.env` → `ANTHROPIC_API_KEY`

❌ **Cartesia**: Need to get
- Sign up: https://cartesia.ai
- Get API key from dashboard
- Add to: `cartesia-agent/.env` → `CARTESIA_API_KEY`

✅ **Supabase**: You already have
- Just need to copy URL and Service Role Key
- Add to both `.env` files

## 🎯 Next Steps (10 minutes)

### Step 1: Get Anthropic API Key (5 min)

1. Go to: https://console.anthropic.com
2. Sign up with email
3. Verify email
4. Go to **Billing** → Add $20 credits
5. Go to **API Keys** → Create new key
6. Copy the key (starts with `sk-ant-api03-`)
7. Open: `cartesia-agent/.env`
8. Paste into `ANTHROPIC_API_KEY=`

### Step 2: Get Cartesia API Key (3 min)

1. Go to: https://cartesia.ai
2. Sign up
3. Go to Dashboard → API Keys
4. Create new key
5. Copy the key
6. Open: `cartesia-agent/.env`
7. Paste into `CARTESIA_API_KEY=`

### Step 3: Add Supabase Credentials (2 min)

1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy **URL**
4. Copy **service_role** key (click "Reveal")
5. Add to both `.env` files:
   - `voice-server/.env`
   - `cartesia-agent/.env`

```bash
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🏃 Running the System

Once you have all API keys configured:

### Terminal 1: Python Agent
```bash
cd /Users/marta/source/amiga-fertility/voice-server
npm run agent
```

Wait for: `Starting agent on port 8000...`

### Terminal 2: Node Bridge
```bash
cd /Users/marta/source/amiga-fertility/voice-server
npm run dev
```

Wait for: `✅ Server running on port 3001`

### Terminal 3: Next.js App
```bash
cd /Users/marta/source/amiga-fertility
npm run dev
```

Wait for: `Ready on http://localhost:3000`

### Test It!

1. Open: http://localhost:3000/appointments/start
2. Enter two phone numbers
3. Click "Start AI-Assisted Appointment"
4. Answer both calls
5. Have a test conversation
6. Say something like "The AMH levels are concerning"
7. Wait for AI to speak! 🎉

## 📊 What Success Looks Like

### Terminal 1 (Python Agent)
```
╔════════════════════════════════════════════════════════════╗
║  Amiga Fertility AI Assistant - Cartesia Line Agent       ║
╚════════════════════════════════════════════════════════════╝

📞 Call started for appointment: abc-123
🎙️  Listening to conversation...
🤖 AI: Just to clarify, AMH is a hormone that helps us...
✅ Logged intervention to database
```

### Terminal 2 (Node Bridge)
```
╔════════════════════════════════════════════════════════════╗
║  Amiga Voice Server - Twilio ↔ Cartesia Line Bridge       ║
╚════════════════════════════════════════════════════════════╝

📞 Starting AI-assisted appointment: abc-123
   Doctor: +1234567890
   Patient: +1234567891
🎙️  MediaStream connected: doctor (abc-123)
✅ Connected to Cartesia Line agent
🎙️  MediaStream connected: patient (abc-123)
```

### Browser
```
✅ Calls initiated
Both participants will be connected shortly
```

## 🆘 Troubleshooting

### "Module 'line' not found"
**Fix**: Python dependencies not installed
```bash
pip3 install cartesia-line python-dotenv supabase fastapi uvicorn websockets
```

### "Failed to connect to Cartesia"
**Fix**: Start Python agent first (Terminal 1), wait for it to be ready, then start Node bridge (Terminal 2)

### "API key invalid"
**Fix**: Double-check keys in `.env` files - no extra spaces, complete key copied

### "Port already in use"
**Fix**: Kill existing processes:
```bash
# Kill port 3001
lsof -ti:3001 | xargs kill -9

# Kill port 8000
lsof -ti:8000 | xargs kill -9
```

## 📚 Full Documentation

- **CARTESIA_LINE_SETUP.md**: Complete architecture guide
- **START_HERE.md**: Original multi-service documentation
- **SETUP_GUIDE.md**: Detailed API key instructions
- **TESTING.md**: Testing scenarios

## 💰 Cost Per Call

30-minute appointment:
- Twilio: $0.85 (phone minutes)
- Cartesia Line: ~$0.50 (STT + TTS)
- Claude: ~$0.30 (AI)
- **Total**: ~$1.65

First call free with credits!

## 🎉 You're Almost There!

Just get those 2 API keys (Anthropic + Cartesia), add your Supabase credentials, and you'll be making AI-assisted calls in minutes!

---

Need help? Check **CARTESIA_LINE_SETUP.md** for detailed troubleshooting.
