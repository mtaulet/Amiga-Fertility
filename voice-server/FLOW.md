# Real-Time AI Assistant Call Flow

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. INITIATE APPOINTMENT                                             │
└─────────────────────────────────────────────────────────────────────┘

    Patient Portal (Next.js)
    /appointments/start
         │
         │ POST /api/appointments/create
         │ {doctor_name, appointment_type, ...}
         │
         ▼
    Supabase: Create appointment record
         │
         │ appointmentId: "abc-123"
         │
         ▼
    POST /api/appointments/abc-123/start-call
    {doctorPhone: "+1...", patientPhone: "+1..."}
         │
         ▼
    Voice Server receives request

┌─────────────────────────────────────────────────────────────────────┐
│  2. SETUP CONFERENCE                                                 │
└─────────────────────────────────────────────────────────────────────┘

    Voice Server
         │
         ├──► Twilio: Call Doctor +1234567890
         │    "Connecting you to appointment with AI assistant..."
         │
         ├──► Twilio: Call Patient +1987654321
         │    "Connecting you to your doctor with AI assistant..."
         │
         └──► Twilio: Create Conference "appointment-abc-123"
                  │
                  ├─ Doctor joins ───┐
                  │                  │
                  ├─ Patient joins ──┼──► Conference Active
                  │                  │
                  └─ AI joins ───────┘
                       (WebSocket connection)

┌─────────────────────────────────────────────────────────────────────┐
│  3. REAL-TIME STREAMING                                              │
└─────────────────────────────────────────────────────────────────────┘

    Conference Audio (mixed)
         │
         │ Twilio Media Stream (WebSocket)
         │ ws://voice-server/stream
         │
         ▼
    Voice Server receives audio chunks
         │
         ├──► Buffer: Store for recording
         │
         └──► Stream to Deepgram
                  │
                  ▼
              Deepgram Live API
                  │
                  │ Real-time transcription
                  │ with speaker diarization
                  │
                  ▼
              {
                speaker: 0 (doctor) / 1 (patient),
                text: "Let's discuss your treatment options",
                confidence: 0.95,
                is_final: true
              }
                  │
                  ▼
              Save to Supabase
              conversation_segments table

┌─────────────────────────────────────────────────────────────────────┐
│  4. AI ANALYSIS (Every Final Transcript)                             │
└─────────────────────────────────────────────────────────────────────┘

    New transcript segment
         │
         ▼
    checkForAIIntervention()
         │
         │ Build context: last 10 messages
         │
         ▼
    Claude API Call
    System prompt:
    "You are Amiga, an AI assistant in a doctor-patient call.
     Listen and decide if you should intervene..."

    Recent conversation:
    - Doctor: "Your FSH levels are elevated..."
    - Patient: "Um, what does that mean?"
    - Doctor: "It indicates ovarian function..."
         │
         ▼
    Claude Response:
    {
      "should_intervene": true,
      "reason": "Patient confused about FSH",
      "message": "FSH stands for Follicle Stimulating Hormone.
                  High levels can indicate lower egg reserve.
                  Doctor, would you like me to explain more?",
      "trigger_type": "clarification_needed"
    }
         │
         ▼
    AI decides: YES, intervene!

┌─────────────────────────────────────────────────────────────────────┐
│  5. AI SPEAKS TO CONFERENCE                                          │
└─────────────────────────────────────────────────────────────────────┘

    AI intervention message
         │
         ▼
    Cartesia TTS API
    {
      transcript: "FSH stands for...",
      voice: {id: "warm-female"},
      output_format: {
        encoding: "pcm_mulaw",
        sample_rate: 8000  // Twilio requirement
      }
    }
         │
         ▼
    Audio bytes generated
         │
         │ Convert to base64
         │
         ▼
    Send via WebSocket to Twilio
    {
      event: "media",
      media: {payload: "base64audio..."}
    }
         │
         ▼
    Twilio plays audio in conference
         │
         ▼
    Doctor + Patient hear:
    "FSH stands for Follicle Stimulating Hormone..."
         │
         ▼
    Log intervention in Supabase
    assistant_interventions table

┌─────────────────────────────────────────────────────────────────────┐
│  6. CONTINUE CONVERSATION LOOP                                       │
└─────────────────────────────────────────────────────────────────────┘

    Conversation continues...
         │
         ├─ Doctor speaks ──► Transcribed ──► Analyzed ──┐
         │                                                │
         ├─ Patient speaks ─► Transcribed ──► Analyzed ──┤
         │                                                │
         └─ AI may speak ───► If intervention needed ────┘
                  │
                  │ (Loop continues)
                  │
                  ▼
    Until call ends...

┌─────────────────────────────────────────────────────────────────────┐
│  7. CALL COMPLETION                                                  │
└─────────────────────────────────────────────────────────────────────┘

    Patient/Doctor hangs up
         │
         ▼
    Twilio: Conference ends
         │
         │ POST /api/conference/status
         │ {StatusCallbackEvent: "conference-end"}
         │
         ▼
    Voice Server:
         │
         ├──► Stop WebSocket streams
         │
         ├──► Finalize Deepgram connection
         │
         ├──► Close audio buffers
         │
         └──► Update Supabase
              appointments.status = 'completed'
         │
         ▼
    Twilio: Recording available
         │
         │ POST /api/recording/status
         │ {RecordingUrl: "https://..."}
         │
         ▼
    Save recording URL to database

┌─────────────────────────────────────────────────────────────────────┐
│  8. POST-CALL PROCESSING                                             │
└─────────────────────────────────────────────────────────────────────┘

    Full transcript + recording available
         │
         ├──► Patient can view on dashboard
         │
         ├──► Patient can call voice agent later
         │    to ask follow-up questions
         │
         └──► Clinic receives summary report
```

## Example Timeline

### Real Appointment (30 minutes)

**0:00** - Calls initiated
- Doctor receives call: "Connecting you..."
- Patient receives call: "Connecting you..."
- Both join conference

**0:30** - AI joins silently
- WebSocket connection established
- Starts listening/transcribing

**2:15** - First AI intervention
```
Doctor: "We'll start with 150 IU of Gonal-F daily"
Patient: "Ok..."
AI: "Gonal-F is a medication that stimulates your ovaries.
     Doctor, should we explain the injection process?"
```

**8:45** - Second intervention
```
Patient: "How successful is this?"
Doctor: "Success rates vary..."
AI: "Would you like me to share the specific success
     rates for your age group and condition?"
```

**15:20** - Emotional support
```
Patient: [voice trembling] "I'm just so worried this won't work"
AI: "It's completely normal to feel anxious. Many patients
     have these same concerns. You're in good hands."
```

**22:10** - Question prompt
```
Doctor: "Any other questions?"
Patient: "Um, I think that's it"
AI: "Just to make sure - have you discussed:
     - Cost and insurance coverage?
     - Timeline for treatment?
     - What to expect for side effects?"
```

**28:30** - Wrap up
```
Doctor: "I'll see you next week"
AI: "I've taken notes of everything discussed today.
     You'll receive a summary and can call me anytime
     with follow-up questions."
```

**30:00** - Call ends
- Recording saved
- Transcript finalized
- Summary generated

## Data Stored

After the call, Supabase contains:

### appointments
```sql
{
  id: "abc-123",
  patient_id: "patient-456",
  doctor_name: "Dr. Sarah Johnson",
  conference_sid: "CF...",
  recording_url: "https://...",
  assistant_contributions: 4,
  status: "completed"
}
```

### conversation_segments (150+ rows)
```sql
{
  id: "seg-1",
  appointment_id: "abc-123",
  speaker: "doctor",
  text: "We'll start with 150 IU of Gonal-F daily",
  timestamp: "2025-02-07T14:02:15Z",
  is_final: true
}
```

### assistant_interventions (4 rows)
```sql
{
  id: "int-1",
  appointment_id: "abc-123",
  trigger_type: "clarification_needed",
  ai_response: "Gonal-F is a medication that...",
  timestamp: "2025-02-07T14:02:15Z",
  helpful_rating: 5
}
```

## Patient Experience After Call

1. **Dashboard shows:**
   - "Your appointment with Dr. Johnson is complete"
   - "View transcript"
   - "Call Amiga to ask questions"

2. **Patient calls Amiga later:**
   ```
   Patient: "What was that medication she mentioned?"
   Amiga: "Dr. Johnson mentioned Gonal-F, which is..."
   ```

3. **Patient views transcript:**
   - Full conversation text
   - AI interventions highlighted in purple
   - Action items extracted
   - Key topics summarized
