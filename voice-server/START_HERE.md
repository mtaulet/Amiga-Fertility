# 🎯 START HERE - Complete Setup Guide

Welcome! Let's get your real-time AI assistant up and running.

## What You're Building

A **live AI assistant** that participates in doctor-patient phone calls:

```
Doctor calls in  →  |
                    |  Twilio Conference Call
Patient calls in →  |         ↓
                         Audio streams
                              ↓
                    Your Voice Server
                              ↓
                    ┌─────────┼─────────┐
                    ↓         ↓         ↓
                Transcribe  Analyze   Speak
                (Deepgram) (Claude) (Cartesia)
```

**The AI can:**
- Listen to conversations in real-time
- Transcribe everything with speaker labels
- Decide when to speak up and help
- Clarify medical terms
- Suggest questions
- Provide emotional support
- Take automated notes

---

## Time Required

- **Setup**: 60 minutes (one time)
- **Testing**: 15 minutes
- **Total**: ~75 minutes

---

## Follow These Steps IN ORDER

### Step 1: Get API Keys (30 mins)

📖 **Read**: `SETUP_GUIDE.md`

Sign up for these services and get API keys:

1. ☎️  **Twilio** - Phone infrastructure ($15 free credit)
2. 🎤 **Deepgram** - Speech-to-text ($200 free credit)
3. 🧠 **Anthropic** - AI brain (add $20 credits)
4. 🗣️  **Cartesia** - Text-to-speech (beta access)
5. 🗄️  **Supabase** - Already have this!

Save all keys in a notes file as you go.

---

### Step 2: Run Database Migration (5 mins)

📖 **Read**: `CONFIGURATION.md` (Section 4)

1. Open Supabase SQL Editor
2. Run migration: `006_appointments_with_live_assistant.sql`
3. Verify 3 new tables created

---

### Step 3: Configure Environment (10 mins)

📖 **Read**: `CONFIGURATION.md`

**Voice Server:**
```bash
cd voice-server
cp .env.example .env
code .env  # Fill in all your API keys
```

**Next.js App:**
```bash
cd ..
echo "NEXT_PUBLIC_VOICE_SERVER_URL=http://localhost:3001" >> .env.local
```

---

### Step 4: Install & Test (15 mins)

📖 **Read**: `CONFIGURATION.md` (Sections 5-6)

```bash
# Install dependencies
cd voice-server
npm install

# Test all connections
# Run each test command from CONFIGURATION.md
```

You should see ✅ for each service.

---

### Step 5: Start Everything (2 mins)

📖 **Read**: `CONFIGURATION.md` (Section 7)

**Terminal 1:**
```bash
cd voice-server
npm run dev
```

**Terminal 2:**
```bash
cd /Users/marta/source/amiga-fertility
npm run dev
```

**Browser:**
```
http://localhost:3000/appointments/start
```

---

### Step 6: Make Your First Call (10 mins)

📖 **Read**: `TESTING.md`

1. Fill in the form with 2 phone numbers
2. Click "Start AI-Assisted Appointment"
3. Answer both calls
4. Have a test conversation
5. Say medical terms to trigger AI!

---

## Visual Checklist

📋 Use `SETUP_CHECKLIST.md` to track progress with checkboxes!

---

## Quick Links

| Document | Purpose |
|----------|---------|
| **START_HERE.md** | You are here! Overview and navigation |
| **SETUP_GUIDE.md** | How to get each API key |
| **CONFIGURATION.md** | How to configure environment variables |
| **TESTING.md** | How to test your first call |
| **SETUP_CHECKLIST.md** | Visual checklist with checkboxes |
| **FLOW.md** | Technical flow diagrams |
| **README.md** | Complete technical documentation |

---

## Cost Overview

### One-Time Setup:
- Twilio phone number: $1.15/month
- Anthropic credits: $20 minimum
- **Total**: ~$21

### Free Credits You Get:
- Twilio: $15 → ~8-10 test calls
- Deepgram: $200 → ~500 calls
- **You can test extensively for free!**

### Per Call (30 min):
- Total cost: ~$1.75
- With free credits: 8-10 free test calls

---

## Support

### Stuck?

1. **Check the specific guide** for your current step
2. **Look at terminal logs** - errors are usually clear
3. **Check SETUP_CHECKLIST.md** - see what you might have missed
4. **Verify API keys** - most issues are typos or wrong keys

### Common Issues:

| Problem | Solution |
|---------|----------|
| Calls don't connect | Check phone numbers have +1, verify Twilio keys |
| No transcription | Verify Deepgram key, check WebSocket in logs |
| AI doesn't speak | Check Claude + Cartesia keys, verify credits |
| Database errors | Re-run migration, check service role key |

---

## After Setup

Once everything works:

1. ✅ Test 3-5 more calls with different scenarios
2. ✅ Review transcripts in database
3. ✅ Customize AI intervention logic
4. ✅ Build patient transcript viewing page
5. ✅ Deploy to production (see DEPLOYMENT.md)

---

## Production Readiness

Before using with real patients:

- [ ] Get BAAs from all services
- [ ] Enable HIPAA mode
- [ ] Deploy to production server
- [ ] Set up monitoring
- [ ] Legal review of AI interventions
- [ ] Patient consent workflow

---

## Architecture Quick Reference

```
USER ACTION          SYSTEM COMPONENT       API SERVICE
──────────          ─────────────────      ───────────

Start appointment  →  Next.js Frontend
                   →  POST /api/appointments/create
                   →  Supabase (create record)

                   →  POST voice-server/start-call
                   →  Twilio (create conference)

Calls connect      →  Twilio Conference
                   →  WebSocket to voice server

Speaking           →  Audio stream
                   →  Voice Server receives
                   →  Deepgram (transcribe)
                   →  Save to Supabase

Every transcript   →  Voice Server analyzes
                   →  Claude (decide intervention)

AI speaks          →  Cartesia (generate speech)
                   →  Stream to Twilio
                   →  Everyone hears AI

Call ends          →  Twilio (save recording)
                   →  Update Supabase
                   →  Available for review
```

---

## Files You Need

Already created for you:

```
voice-server/
├── index.js                 # Main server
├── package.json            # Dependencies
├── .env.example            # Template for your .env
├── START_HERE.md          # This file
├── SETUP_GUIDE.md         # API key instructions
├── CONFIGURATION.md       # Setup instructions
├── TESTING.md             # Testing guide
├── SETUP_CHECKLIST.md     # Visual checklist
├── FLOW.md                # Technical diagrams
├── README.md              # Full documentation
└── QUICKSTART.md          # Fast setup guide

supabase/migrations/
└── 006_appointments_with_live_assistant.sql  # Database schema

src/app/
├── appointments/start/page.tsx  # Start appointment UI
└── api/appointments/create/route.ts  # Create appointment API
```

---

## Your Next Action

🚀 **Start with**: `SETUP_GUIDE.md`

Open it and begin getting your API keys!

---

## Questions?

### "Do I really need all these services?"

Yes! Each has a specific role:
- Twilio = Handles phone calls
- Deepgram = Turns speech into text
- Claude = AI brain that decides when to help
- Cartesia = Turns AI responses into natural speech
- Supabase = Stores everything

### "Can I use alternatives?"

Some yes:
- ✅ Cartesia → ElevenLabs (easier to get)
- ✅ Deepgram → AssemblyAI (similar)
- ❌ Twilio → Hard to replace (best for healthcare)
- ❌ Claude → Could use GPT-4, but Claude is better for healthcare

### "Is this HIPAA compliant?"

For testing: No need yet
For production: Yes, but requires:
- BAAs from each service
- HIPAA-tier accounts
- Additional setup

We'll handle that later!

### "How much will testing cost?"

With free credits: **$0** for first 8-10 calls
After free credits: **~$1.75** per 30-min call

Very affordable for testing!

---

## Let's Go! 🚀

**Your first step:**

```bash
# Open the setup guide
cd /Users/marta/source/amiga-fertility/voice-server
cat SETUP_GUIDE.md
```

Then start signing up for services!

Good luck - you're building something incredible! 💜

---

*Need help? Check the specific guide for your current step!*
