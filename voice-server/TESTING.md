# Testing Guide - Your First AI-Assisted Call

Let's test the complete system with a real phone call!

## Prerequisites

- [ ] Both servers running (voice server on 3001, Next.js on 3000)
- [ ] Database migration completed
- [ ] All API keys configured
- [ ] 2 phone numbers available for testing

---

## Test #1: Basic Call Setup

### Step 1: Prepare Test Phones

You'll need TWO phone numbers:

**Option A: Two Different Phones**
- Your phone: Will be "Doctor"
- Friend/family phone: Will be "Patient"

**Option B: One Phone + Google Voice**
- Your phone: Will be "Doctor"
- Google Voice number: Will be "Patient"
- Download Google Voice app: https://voice.google.com

**Option C: Two Phones You Own**
- Phone 1: "Doctor"
- Phone 2: "Patient"

### Step 2: Start an Appointment

1. Open browser: http://localhost:3000
2. Sign in
3. Go to: http://localhost:3000/appointments/start
4. Fill in the form:
   ```
   Doctor Name: Test Doctor
   Doctor Phone: +1YOUR_PHONE_NUMBER
   Patient Phone: +1OTHER_PHONE_NUMBER
   Appointment Type: Initial Consultation
   ```
5. Click "Start AI-Assisted Appointment"

### Step 3: Answer the Calls

**Within 10-15 seconds:**

1. **"Doctor" phone rings first**
   - Answer it
   - You'll hear: "Connecting you to the appointment. The AI assistant Amiga will be listening..."
   - You'll be in the conference (may hear hold music briefly)

2. **"Patient" phone rings second**
   - Answer it
   - You'll hear: "Connecting you to your doctor. Our AI assistant Amiga will be listening..."
   - Joins the conference

3. **Both phones connected!**
   - You should hear each other
   - AI is listening (silent for now)

### Step 4: Test AI Intervention

**Say this conversation:**

```
Doctor: "Your AMH test results show you have diminished ovarian reserve"
[Pause 3 seconds]

Patient: "Um, okay... what does that mean exactly?"
[Pause 3 seconds]
```

**AI should intervene within 5 seconds:**
- "AMH stands for Anti-Müllerian Hormone, which helps measure your egg supply. Would you like me to explain more about what this means for your treatment options?"

### Step 5: Continue Conversation

Try more triggers:

```
Doctor: "We'll start you on Gonal-F, 150 IU daily"
[Pause]
- AI might explain: "Gonal-F is a medication that stimulates your ovaries..."

Patient: "How much does this cost?"
Doctor: "We can discuss that later"
[Pause]
- AI might say: "Would it be helpful to discuss costs now? This is an important consideration..."

Patient: [Upset tone] "I'm just so worried this won't work"
[Pause]
- AI should provide emotional support
```

### Step 6: End the Call

- Hang up on either phone
- Conference should end
- Check voice server logs for activity

---

## Verifying the Test

### Check Voice Server Logs

You should see:
```
WebSocket connection established
Stream started for appointment: abc-123
[doctor] Your AMH test results... (final: true)
[patient] Um okay what does that mean (final: true)
AI intervening: clarification_needed
AI speaking: "AMH stands for Anti-Müllerian Hormone..."
Audio sent to conference
Stream stopped
WebSocket connection closed
```

### Check Database

Open Supabase SQL Editor and run:

```sql
-- Get your appointment
SELECT
  id,
  doctor_name,
  status,
  assistant_contributions,
  conference_sid
FROM appointments
ORDER BY created_at DESC
LIMIT 1;
```

Should show:
```
status: 'completed'
assistant_contributions: 2 (or however many times AI spoke)
conference_sid: 'appointment-abc-123'
```

### Check Transcript

```sql
-- Get transcript segments
SELECT
  speaker,
  text,
  timestamp
FROM conversation_segments
WHERE appointment_id = 'YOUR_APPOINTMENT_ID'
ORDER BY timestamp ASC;
```

Should show all spoken words with correct speakers.

### Check AI Interventions

```sql
-- Get AI contributions
SELECT
  trigger_type,
  ai_response,
  timestamp
FROM assistant_interventions
WHERE appointment_id = 'YOUR_APPOINTMENT_ID'
ORDER BY timestamp ASC;
```

Should show each time AI spoke and why.

---

## Test #2: No AI Intervention (Control Test)

Test that AI doesn't interrupt unnecessarily:

```
Doctor: "How are you feeling today?"
Patient: "I'm good, thanks"
Doctor: "Great, let's get started"
Patient: "Sounds good"
```

**AI should NOT speak** - conversation is flowing naturally.

---

## Test #3: Multiple Interventions

Test multiple AI contributions:

```
1. Doctor uses medical term → AI clarifies
2. Patient asks question → Doctor doesn't answer → AI prompts
3. Discussion gets complex → AI summarizes
4. Patient sounds upset → AI provides support
```

AI should speak 3-4 times in a 5-minute call.

---

## What to Watch For

### ✅ Good Signs:
- Both phones connect within 15 seconds
- Audio is clear both ways
- AI speaks at appropriate times
- Transcription is accurate (>90%)
- No awkward silences or delays
- AI voice sounds natural

### ❌ Problems to Fix:

**Calls don't connect:**
- Check Twilio account SID/auth token
- Verify phone numbers have +country code
- Check voice server logs for errors

**No transcription appearing:**
- Check Deepgram API key
- Look for "Deepgram error" in logs
- Verify WebSocket connection

**AI never speaks:**
- Check Claude API key and credits
- Verify Cartesia API key
- Check intervention logic in logs
- AI might be correctly deciding not to intervene

**Audio quality issues:**
- Check internet connection
- Try different phone numbers
- Reduce background noise

**AI interrupts too much:**
- Adjust intervention threshold in code
- Make context window larger (more messages before deciding)

**AI interrupts too little:**
- Say more medical terms
- Create more obvious confusion moments
- Check Claude API logs

---

## Monitoring During Test

### Terminal 1 (Voice Server):
Watch for:
```
✅ WebSocket connection established
✅ Stream started for appointment
✅ [speaker] transcription appearing
✅ AI intervening: reason
✅ Audio sent to conference
```

### Terminal 2 (Next.js App):
Watch for errors in the browser console (F12)

### Supabase Logs:
Go to: Dashboard → Logs → Postgres
Watch for database inserts in real-time

---

## Cost of Test Call

A 5-minute test call costs:
- Twilio: $0.195 (3 participants × 5 min × $0.013/min)
- Deepgram: $0.063 (5 min × $0.0125/min)
- Claude: ~$0.05 (analysis + intervention)
- Cartesia: ~$0.02 (1-2 AI responses)
- **Total: ~$0.33**

You can do ~45 test calls with your free credits!

---

## Troubleshooting Common Issues

### "No audio streaming to Deepgram"
```bash
# Check WebSocket connection
# In voice server logs, you should see:
Stream started for appointment: xxx

# If not, check:
1. WebSocket upgrade working
2. Twilio sending media packets
3. Check for errors in server logs
```

### "AI speaks but no one hears it"
```bash
# Check Cartesia response
# Look for "Audio sent to conference" in logs

# If missing:
1. Verify Cartesia API key
2. Check audio format (must be mulaw, 8kHz)
3. Verify WebSocket stream SID
```

### "Transcription is gibberish"
```bash
# Check audio quality
# Common causes:
1. Bad phone connection
2. Background noise
3. Speaking too fast
4. Multiple people speaking at once

# Solution:
- Speak clearly
- Reduce background noise
- Pause between speakers
```

### "AI response is off-topic"
```bash
# Check conversation context
# The AI sees last 10 messages

# If context is wrong:
1. Check speaker diarization
2. Verify transcript accuracy
3. Adjust context window size
```

---

## Test Scenarios Library

### Scenario 1: IVF Consultation
```
Doctor: "We recommend starting with IVF. Your AFC is 8."
Patient: "What's AFC?"
→ AI should explain: "AFC stands for Antral Follicle Count..."

Doctor: "We'll use ICSI for fertilization"
Patient: "And that is...?"
→ AI should explain ICSI

Doctor: "Success rate is about 40%"
Patient: "That seems low..."
→ AI should provide encouragement
```

### Scenario 2: Medication Discussion
```
Doctor: "You'll inject Gonal-F subcutaneously"
Patient: "I've never given myself shots before"
→ AI might offer: "Would you like me to explain the injection process?"

Doctor: "Start with 150 IU"
Patient: "When do I take it?"
Doctor: "Same time every evening"
→ AI might summarize: "So that's 150 IU of Gonal-F every evening..."
```

### Scenario 3: Emotional Support
```
Patient: "I've done two cycles already and I'm exhausted"
Doctor: "I understand it's difficult"
Patient: [crying] "I don't know if I can do this again"
→ AI should provide empathy and support
```

---

## Success Criteria

Your test is successful if:

- [ ] Both phones connect reliably
- [ ] Audio is clear and synchronized
- [ ] Transcription accuracy >85%
- [ ] AI intervenes 2-3 times per 5-minute call
- [ ] AI interventions are helpful and appropriate
- [ ] AI doesn't interrupt natural flow
- [ ] Database captures all data correctly
- [ ] No errors in server logs
- [ ] Call ends cleanly

---

## Recording the Test

After your test call:

1. **Check Twilio console:**
   - Go to: Monitor → Logs → Calls
   - Find your two calls
   - Check for errors

2. **Download recording:**
   - Twilio automatically records the conference
   - Find in: Monitor → Logs → Recordings
   - Listen to verify quality

3. **Review transcript:**
   ```sql
   SELECT * FROM conversation_segments
   WHERE appointment_id = 'YOUR_ID'
   ORDER BY timestamp;
   ```

4. **Rate AI interventions:**
   - Were they helpful?
   - Too frequent or too rare?
   - Accurate and relevant?

---

## Next Steps

After successful testing:

1. **Test with 5-10 more calls** to ensure reliability
2. **Try different scenarios** (different medical topics)
3. **Test error recovery** (what if someone hangs up early?)
4. **Load test** (can it handle 2-3 concurrent calls?)
5. **Customize AI behavior** based on what you learned

Ready for production? → See `DEPLOYMENT.md`

---

## Getting Help

If something isn't working:

1. **Check logs first:**
   - Voice server terminal
   - Next.js terminal
   - Browser console (F12)
   - Supabase logs

2. **Common fixes:**
   ```bash
   # Restart voice server
   cd voice-server
   npm run dev

   # Clear Node cache
   rm -rf node_modules
   npm install

   # Check Twilio debugger
   # Visit: https://console.twilio.com/debugger
   ```

3. **Debug mode:**
   Add to `voice-server/.env`:
   ```
   DEBUG=true
   LOG_LEVEL=verbose
   ```

Enjoy testing your AI assistant! 🎉📞
