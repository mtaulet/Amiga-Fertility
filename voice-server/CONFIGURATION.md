# Configuration Guide - Setting Up Environment Variables

Once you have all your API keys, let's configure the system!

## 1. Configure Voice Server

### Create .env file

```bash
cd /Users/marta/source/amiga-fertility/voice-server

# Copy the example file
cp .env.example .env

# Open in editor
nano .env
# or
code .env
```

### Fill in your values:

```bash
# ====================
# TWILIO
# ====================
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=your_auth_token_here_32_chars
TWILIO_PHONE_NUMBER=+12345678900

# ====================
# SUPABASE
# ====================
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ====================
# ANTHROPIC CLAUDE
# ====================
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ====================
# CARTESIA (Voice)
# ====================
CARTESIA_API_KEY=your_cartesia_api_key_here

# If using ElevenLabs instead:
# ELEVENLABS_API_KEY=your_elevenlabs_key

# ====================
# DEEPGRAM (Speech-to-Text)
# ====================
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# ====================
# SERVER CONFIG
# ====================
PORT=3001
NODE_ENV=development
```

### Save the file
- **Nano**: Press `Ctrl+X`, then `Y`, then `Enter`
- **VS Code**: Just save normally

---

## 2. Configure Next.js App

### Update .env.local

```bash
cd /Users/marta/source/amiga-fertility

# Open your existing .env.local
nano .env.local
# or
code .env.local
```

### Add this line at the bottom:

```bash
# Voice Server URL
NEXT_PUBLIC_VOICE_SERVER_URL=http://localhost:3001
```

**Your complete .env.local should look like:**

```bash
# Auth0
AUTH0_SECRET=your_existing_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=your_existing_auth0_issuer
AUTH0_CLIENT_ID=your_existing_auth0_client_id
AUTH0_CLIENT_SECRET=your_existing_auth0_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_existing_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_existing_service_role_key

# Voice Server (NEW - add this)
NEXT_PUBLIC_VOICE_SERVER_URL=http://localhost:3001
```

### Save the file

---

## 3. Verify Configuration

### Check Voice Server Config

```bash
cd /Users/marta/source/amiga-fertility/voice-server

# This will show you if any env vars are missing
node -e "
const dotenv = require('dotenv');
dotenv.config();
const required = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'CARTESIA_API_KEY',
  'DEEPGRAM_API_KEY'
];
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.log('❌ Missing env vars:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!');
}
"
```

If you see ✅, you're good to go!

---

## 4. Run Database Migration

### Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Click "New Query"
3. Copy ENTIRE contents of:
   ```
   /Users/marta/source/amiga-fertility/supabase/migrations/006_appointments_with_live_assistant.sql
   ```
4. Paste into SQL editor
5. Click "Run"

### Verify Tables Created

Run this query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('appointments', 'conversation_segments', 'assistant_interventions');
```

You should see 3 rows returned.

---

## 5. Install Dependencies

### Voice Server

```bash
cd /Users/marta/source/amiga-fertility/voice-server

npm install
```

You should see:
```
added 47 packages, and audited 48 packages in 3s
```

### Verify Installation

```bash
npm list --depth=0
```

Should show:
```
amiga-voice-server@1.0.0
├── @anthropic-ai/sdk@0.34.0
├── @cartesia/cartesia-js@1.2.0
├── @deepgram/sdk@3.7.0
├── @supabase/supabase-js@2.46.1
├── dotenv@16.4.5
├── express@4.21.2
├── twilio@5.3.4
└── ws@8.18.0
```

---

## 6. Test Basic Connectivity

### Test Twilio

```bash
cd /Users/marta/source/amiga-fertility/voice-server

node -e "
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

client.incomingPhoneNumbers
  .list({limit: 1})
  .then(numbers => {
    console.log('✅ Twilio connected!');
    console.log('Your phone number:', numbers[0].phoneNumber);
  })
  .catch(err => console.error('❌ Twilio error:', err.message));
"
```

### Test Deepgram

```bash
node -e "
const { createClient } = require('@deepgram/sdk');
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

deepgram.manage.getBalances()
  .then(response => {
    console.log('✅ Deepgram connected!');
    console.log('Balance:', response.balances[0].amount);
  })
  .catch(err => console.error('❌ Deepgram error:', err.message));
"
```

### Test Anthropic

```bash
node -e "
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY});

client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 10,
  messages: [{role: 'user', content: 'Hi'}]
})
  .then(msg => {
    console.log('✅ Anthropic connected!');
    console.log('Response:', msg.content[0].text);
  })
  .catch(err => console.error('❌ Anthropic error:', err.message));
"
```

### Test Supabase

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

supabase.from('patients').select('count').limit(1)
  .then(result => {
    console.log('✅ Supabase connected!');
  })
  .catch(err => console.error('❌ Supabase error:', err.message));
"
```

**If all 4 show ✅, you're ready to start!**

---

## 7. Start the Servers

### Terminal 1: Voice Server

```bash
cd /Users/marta/source/amiga-fertility/voice-server

npm run dev
```

You should see:
```
Voice server running on port 3001
```

**Leave this terminal running!**

### Terminal 2: Next.js App

```bash
cd /Users/marta/source/amiga-fertility

npm run dev
```

You should see:
```
▲ Next.js 16.1.6 (Turbopack)
- Local:    http://localhost:3000
- Network:  http://10.x.x.x:3000

✓ Starting...
✓ Ready in 2.5s
```

**Leave this terminal running too!**

---

## 8. Test the UI

1. Open browser: http://localhost:3000
2. Sign in to your account
3. Navigate to: http://localhost:3000/appointments/start
4. You should see the "Start AI-Assisted Appointment" page

If you see this page with no errors, **configuration is complete!** ✅

---

## Common Configuration Errors

### "Cannot find module 'dotenv'"
```bash
cd voice-server
npm install
```

### "TWILIO_ACCOUNT_SID is not defined"
- Check `.env` file exists in `voice-server/` directory
- Make sure no typos in variable names
- No quotes around values
- No spaces around `=`

### "Failed to connect to Supabase"
- Verify SUPABASE_URL starts with `https://`
- Check SERVICE_ROLE_KEY is the full JWT token
- Make sure using correct project

### "Anthropic API error: invalid_api_key"
- Verify key starts with `sk-ant-`
- Check you added credits to your account
- Key must be from console.anthropic.com

### "Port 3001 already in use"
```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9

# Or change port in .env
PORT=3002
```

---

## Security Checklist

Before committing code:

- [ ] `.env` is in `.gitignore` ✅ (should already be)
- [ ] Never commit API keys to Git
- [ ] Service role key not exposed to browser
- [ ] Only NEXT_PUBLIC_* variables accessible client-side

---

## Next Steps

Configuration complete! Now you can:

1. **Test with a real call** → `TESTING.md`
2. **Deploy to production** → `DEPLOYMENT.md`
3. **Customize AI behavior** → `CUSTOMIZATION.md`

**Ready to make your first AI-assisted call?** 🎉

Continue to: `TESTING.md`
