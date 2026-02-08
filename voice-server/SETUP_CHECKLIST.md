# Setup Checklist ✅

Use this checklist to track your progress!

## Phase 1: Get API Keys (30 mins)

### Twilio
- [ ] Sign up at https://www.twilio.com/try-twilio
- [ ] Verify email and phone
- [ ] Copy Account SID (starts with AC...)
- [ ] Copy Auth Token (click "Show")
- [ ] Buy a phone number (+1...)
- [ ] Save to notes:
  ```
  TWILIO_ACCOUNT_SID=AC...
  TWILIO_AUTH_TOKEN=...
  TWILIO_PHONE_NUMBER=+1...
  ```

### Deepgram
- [ ] Sign up at https://console.deepgram.com/signup
- [ ] Verify email
- [ ] Go to API Keys
- [ ] Create key named "Amiga Voice Server"
- [ ] Copy key immediately
- [ ] Save to notes:
  ```
  DEEPGRAM_API_KEY=...
  ```

### Anthropic Claude
- [ ] Sign up at https://console.anthropic.com
- [ ] Verify email and phone
- [ ] Go to Billing
- [ ] Add $20 credits
- [ ] Go to API Keys
- [ ] Create key named "Amiga Voice Server"
- [ ] Copy key (starts with sk-ant-...)
- [ ] Save to notes:
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  ```

### Cartesia
- [ ] Sign up at https://cartesia.ai
- [ ] Apply for beta access (if needed)
- [ ] Wait for approval email
- [ ] Go to Dashboard → API Keys
- [ ] Create key named "Amiga Voice Server"
- [ ] Copy key
- [ ] Save to notes:
  ```
  CARTESIA_API_KEY=...
  ```

**OR if Cartesia waitlisted:**

- [ ] Sign up at https://elevenlabs.io instead
- [ ] Go to Profile → API Keys
- [ ] Create key
- [ ] Copy key
- [ ] Save to notes:
  ```
  ELEVENLABS_API_KEY=...
  ```

### Supabase (Already have)
- [ ] Go to your project dashboard
- [ ] Click Settings → API
- [ ] Copy URL
- [ ] Copy Service Role Key (click "Reveal")
- [ ] Save to notes:
  ```
  SUPABASE_URL=https://...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  ```

---

## Phase 2: Database Setup (5 mins)

- [ ] Open Supabase SQL Editor
- [ ] Open file: `supabase/migrations/006_appointments_with_live_assistant.sql`
- [ ] Copy entire contents
- [ ] Paste into SQL editor
- [ ] Click "Run"
- [ ] Verify success (no errors)
- [ ] Run verification query:
  ```sql
  SELECT table_name
  FROM information_schema.tables
  WHERE table_name IN ('appointments', 'conversation_segments', 'assistant_interventions');
  ```
- [ ] See 3 rows returned ✅

---

## Phase 3: Configuration (10 mins)

### Voice Server

- [ ] Open terminal
- [ ] Navigate to voice server:
  ```bash
  cd /Users/marta/source/amiga-fertility/voice-server
  ```
- [ ] Copy env template:
  ```bash
  cp .env.example .env
  ```
- [ ] Open .env in editor:
  ```bash
  code .env
  # or
  nano .env
  ```
- [ ] Paste all your API keys from notes
- [ ] Save file
- [ ] Verify configuration:
  ```bash
  node -e "require('dotenv').config(); console.log(process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Missing vars')"
  ```
- [ ] See ✅ Configured

### Next.js App

- [ ] Open .env.local:
  ```bash
  cd /Users/marta/source/amiga-fertility
  code .env.local
  ```
- [ ] Add at bottom:
  ```bash
  NEXT_PUBLIC_VOICE_SERVER_URL=http://localhost:3001
  ```
- [ ] Save file

---

## Phase 4: Install Dependencies (5 mins)

### Voice Server

- [ ] Navigate to voice server:
  ```bash
  cd /Users/marta/source/amiga-fertility/voice-server
  ```
- [ ] Install packages:
  ```bash
  npm install
  ```
- [ ] Wait for completion
- [ ] Verify:
  ```bash
  npm list --depth=0
  ```
- [ ] See ~8 packages listed ✅

---

## Phase 5: Test Connectivity (10 mins)

### Test Twilio

```bash
cd /Users/marta/source/amiga-fertility/voice-server

node -e "
require('dotenv').config();
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
client.incomingPhoneNumbers.list({limit: 1})
  .then(n => console.log('✅ Twilio:', n[0].phoneNumber))
  .catch(e => console.error('❌', e.message));
"
```

- [ ] See ✅ with your phone number

### Test Deepgram

```bash
node -e "
require('dotenv').config();
const { createClient } = require('@deepgram/sdk');
const dg = createClient(process.env.DEEPGRAM_API_KEY);
dg.manage.getBalances()
  .then(r => console.log('✅ Deepgram: $' + r.balances[0].amount))
  .catch(e => console.error('❌', e.message));
"
```

- [ ] See ✅ with your balance

### Test Anthropic

```bash
node -e "
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY});
client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 10,
  messages: [{role: 'user', content: 'Hi'}]
})
  .then(m => console.log('✅ Anthropic:', m.content[0].text))
  .catch(e => console.error('❌', e.message));
"
```

- [ ] See ✅ with Claude's response

### Test Supabase

```bash
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('patients').select('count').limit(1)
  .then(r => console.log('✅ Supabase: Connected'))
  .catch(e => console.error('❌', e.message));
"
```

- [ ] See ✅ Supabase: Connected

---

## Phase 6: Start Servers (2 mins)

### Terminal 1: Voice Server

```bash
cd /Users/marta/source/amiga-fertility/voice-server
npm run dev
```

- [ ] See "Voice server running on port 3001"
- [ ] Leave terminal open

### Terminal 2: Next.js App

```bash
cd /Users/marta/source/amiga-fertility
npm run dev
```

- [ ] See "Ready in X.Xs"
- [ ] Leave terminal open

### Browser

- [ ] Open: http://localhost:3000
- [ ] Sign in
- [ ] Go to: http://localhost:3000/appointments/start
- [ ] See the "Start AI-Assisted Appointment" page
- [ ] No errors in browser console (F12)

---

## Phase 7: First Test Call (10 mins)

### Prepare

- [ ] Have 2 phone numbers ready
- [ ] Phone 1 (You): Doctor role
- [ ] Phone 2 (Friend/Google Voice): Patient role
- [ ] Both phones nearby and charged

### Start Call

- [ ] Fill in form:
  - Doctor Name: "Test Doctor"
  - Doctor Phone: +1YOUR_NUMBER
  - Patient Phone: +1OTHER_NUMBER
  - Type: Initial Consultation
- [ ] Click "Start AI-Assisted Appointment"
- [ ] See success message

### Answer Calls

- [ ] Doctor phone rings (within 15 sec)
- [ ] Answer and hear: "Connecting you to appointment..."
- [ ] Wait in conference
- [ ] Patient phone rings (within 15 sec)
- [ ] Answer and hear: "Connecting you to your doctor..."
- [ ] Both connected ✅

### Test AI

- [ ] Doctor says: "Your AMH levels show diminished ovarian reserve"
- [ ] Wait 3 seconds
- [ ] Patient says: "What does that mean?"
- [ ] Wait 5 seconds
- [ ] AI should speak! 🎉

### End Call

- [ ] Hang up
- [ ] Conference ends
- [ ] Both terminals show activity

---

## Phase 8: Verify Everything Works

### Check Logs

Voice Server Terminal:
- [ ] See "WebSocket connection established"
- [ ] See "[doctor] ..." transcriptions
- [ ] See "[patient] ..." transcriptions
- [ ] See "AI intervening: clarification_needed"
- [ ] See "Audio sent to conference"

### Check Database

```sql
-- Latest appointment
SELECT * FROM appointments ORDER BY created_at DESC LIMIT 1;
```
- [ ] Status is 'completed'
- [ ] assistant_contributions > 0

```sql
-- Transcript
SELECT speaker, text FROM conversation_segments
WHERE appointment_id = 'YOUR_ID' ORDER BY timestamp;
```
- [ ] See doctor and patient messages
- [ ] Transcription accurate

```sql
-- AI interventions
SELECT * FROM assistant_interventions
WHERE appointment_id = 'YOUR_ID';
```
- [ ] At least 1 row
- [ ] ai_response field has text

---

## Success! 🎉

If all checkboxes above are checked, you have:

✅ All API keys configured
✅ Database set up
✅ Servers running
✅ First test call successful
✅ AI spoke during call
✅ Transcript saved to database

---

## What's Next?

- [ ] Do 2-3 more test calls
- [ ] Try different medical terms
- [ ] Test emotional support scenarios
- [ ] Review transcripts in database
- [ ] Customize AI behavior
- [ ] Build transcript viewing page
- [ ] Deploy to production

---

## Troubleshooting

If any checkbox is ❌:

1. **API keys not working:**
   - Double-check you copied full key
   - Verify no extra spaces
   - Check key is valid (not revoked)
   - Ensure credits available (Anthropic)

2. **Calls not connecting:**
   - Verify phone numbers have +1 prefix
   - Check Twilio account has credits
   - Look at Twilio debugger console
   - Check voice server logs for errors

3. **No transcription:**
   - Verify Deepgram key
   - Check WebSocket connection
   - Look for errors in voice server logs
   - Ensure audio is streaming

4. **AI not speaking:**
   - Check Claude API key and credits
   - Verify Cartesia key
   - Look for "AI intervening" in logs
   - AI might correctly decide not to speak

5. **Database errors:**
   - Verify migration ran successfully
   - Check Supabase service role key
   - Look at Supabase logs
   - Check RLS policies

---

## Quick Reference

### Restart Everything

```bash
# Terminal 1
cd voice-server
npm run dev

# Terminal 2
cd ..
npm run dev
```

### View Logs

```bash
# Voice server
cd voice-server
tail -f debug.log

# Supabase
# Go to: Dashboard → Logs → Postgres
```

### Check Costs

- Twilio: https://console.twilio.com/billing
- Deepgram: https://console.deepgram.com/billing
- Anthropic: https://console.anthropic.com/billing
- Cartesia: Dashboard → Usage

### Emergency Stop

```bash
# Kill voice server
pkill -f "node index.js"

# Or Ctrl+C in terminal

# Kill Next.js
pkill -f "next dev"

# Or Ctrl+C in terminal
```

---

## Support Resources

- **Twilio Issues**: https://console.twilio.com/debugger
- **Deepgram Docs**: https://developers.deepgram.com
- **Claude API Docs**: https://docs.anthropic.com
- **Cartesia Docs**: https://docs.cartesia.ai
- **Your Setup Guides**: Check SETUP_GUIDE.md, CONFIGURATION.md, TESTING.md

Good luck! You're building something incredible! 🚀
