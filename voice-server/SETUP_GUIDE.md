# Complete API Setup Guide

## 1. Twilio (Required - Voice Infrastructure)

### Sign Up
1. Go to: https://www.twilio.com/try-twilio
2. Click "Sign up and start building"
3. Fill in:
   - Email
   - Password
   - First/Last Name
   - Phone (for verification)
4. Verify your email
5. Verify your phone number

### Get Free Credits
- ✅ You get **$15 free credit** to start
- This covers ~10-15 test calls (30 mins each)

### Get Your Account SID and Auth Token
1. After login, you'll be at the Console Dashboard
2. Look for "Account Info" section (right side or top)
3. You'll see:
   - **Account SID**: Starts with "AC..." (copy this)
   - **Auth Token**: Hidden, click "Show" to reveal (copy this)

### Buy a Phone Number
1. In left sidebar: Phone Numbers → Manage → Buy a number
2. Search by:
   - Country: United States (or your country)
   - Capabilities: Check "Voice" ✅
3. Click "Search"
4. Pick any number (costs $1.15/month)
5. Click "Buy"
6. Copy your new number (format: +1234567890)

**Save these:**
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

---

## 2. Deepgram (Required - Speech-to-Text)

### Sign Up
1. Go to: https://console.deepgram.com/signup
2. Click "Get Started"
3. Sign up with:
   - Email
   - Password
   - Name
4. Verify email

### Get Free Credits
- ✅ You get **$200 free credit**
- This covers ~16,000 minutes of transcription!
- More than enough for testing

### Get API Key
1. After login, go to left sidebar → "API Keys"
2. Click "Create a New API Key"
3. Name it: "Amiga Voice Server"
4. Scopes: Leave defaults (all permissions)
5. Click "Create Key"
6. **IMPORTANT**: Copy the key immediately (you won't see it again!)

**Save this:**
```
DEEPGRAM_API_KEY=...
```

---

## 3. Anthropic Claude (Required - AI Brain)

### Sign Up
1. Go to: https://console.anthropic.com
2. Click "Sign Up"
3. Use:
   - Email
   - Phone number (for verification)
4. Verify your email and phone

### Add Credits
**NOTE:** Anthropic requires you to add credits before using the API
1. After login, click your name (top right) → "Billing"
2. Click "Purchase Credits"
3. Recommended: Start with **$20** (covers ~200 appointments)
4. Add payment method
5. Purchase credits

### Get API Key
1. Go to: https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Name it: "Amiga Voice Server"
4. Copy the key (starts with "sk-ant-...")

**Save this:**
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Pricing Reference
- Claude Sonnet 4.5:
  - Input: $3 per million tokens
  - Output: $15 per million tokens
- Per appointment: ~$0.10-0.15

---

## 4. Cartesia (Required - Text-to-Speech)

### Sign Up
1. Go to: https://cartesia.ai
2. Click "Get Started" or "Sign Up"
3. **NOTE**: May require waitlist/beta access
4. Fill in:
   - Email
   - Company: "Amiga Fertility"
   - Use case: "Healthcare voice assistant"

### Get API Key
1. Once approved and logged in
2. Go to: Dashboard → API Keys
3. Click "Create API Key"
4. Name: "Amiga Voice Server"
5. Copy the key

**Alternative if Cartesia is waitlisted:**

Use **ElevenLabs** instead:
- Go to: https://elevenlabs.io
- Sign up (get 10,000 free characters/month)
- Go to Profile → API Keys
- Create new key

**Save this:**
```
CARTESIA_API_KEY=...
# OR
ELEVENLABS_API_KEY=...
```

### Pricing Reference
- Cartesia: ~$0.05 per 1,000 characters
- Per appointment: ~$0.05

---

## 5. Supabase (Already Have - Just Need Keys)

### Get Service Role Key
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT
2. Click Settings (left sidebar)
3. Click "API"
4. Under "Project API keys", find:
   - **URL**: `https://xxx.supabase.co` (copy)
   - **anon/public key**: (already have)
   - **service_role key**: Click "Reveal" and copy

**⚠️ IMPORTANT:** Service role key bypasses RLS - keep it secret!

**Save this:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Setup Checklist

Before proceeding, make sure you have:

- [ ] Twilio Account SID
- [ ] Twilio Auth Token
- [ ] Twilio Phone Number (+1...)
- [ ] Deepgram API Key
- [ ] Anthropic API Key (with credits added)
- [ ] Cartesia API Key (or ElevenLabs)
- [ ] Supabase URL
- [ ] Supabase Service Role Key

---

## Cost Summary

### Initial Setup Costs:
- Twilio phone number: $1.15/month
- Anthropic credits: $20 (recommended minimum)
- Everything else: FREE with trial credits

### Per-Appointment Costs:
| Service | Cost per 30-min call |
|---------|---------------------|
| Twilio | $1.17 |
| Deepgram | $0.38 |
| Anthropic | $0.15 |
| Cartesia | $0.05 |
| **Total** | **~$1.75** |

### Free Tier Coverage:
- Twilio: $15 = ~8-10 test calls
- Deepgram: $200 = ~500 calls
- Anthropic: $20 = ~120 calls
- Cartesia: 10K chars = ~20 AI responses

**You can test with ~8-10 full appointments before spending more!**

---

## HIPAA Compliance (For Production)

When ready for real patients, you'll need BAAs (Business Associate Agreements):

### Twilio
- Upgrade to HIPAA-eligible account
- Cost: Starting at $39/month
- Request BAA: https://www.twilio.com/legal/hipaa

### Deepgram
- Contact sales for HIPAA plan
- Email: sales@deepgram.com
- Mention: Healthcare/HIPAA compliance needed

### Anthropic
- BAA available for API customers
- Contact: sales@anthropic.com
- Mention: Healthcare use case

### Cartesia
- Verify HIPAA compliance availability
- May need enterprise plan

### Supabase
- Already have HIPAA options
- Can enable when ready

**For testing/MVP: Free tiers are fine!**

---

## Troubleshooting Sign-ups

### Twilio: "Can't verify phone"
- Try different phone number
- Use Google Voice if needed
- Contact support via chat

### Anthropic: "Need more info"
- They may ask about use case
- Mention: "Healthcare appointment transcription"
- Usually approved within 24 hours

### Cartesia: "Waitlist"
- Apply and wait for approval
- Meanwhile, use ElevenLabs alternative
- Both work the same way

### Deepgram: "Verification pending"
- Check email for verification link
- May take a few minutes
- Check spam folder

---

## Next Steps

Once you have all API keys, continue to:
→ `CONFIGURATION.md` to set up your environment
