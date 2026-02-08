-- Appointments table (if not exists from previous migrations)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  clinic_id UUID REFERENCES clinics(id),
  doctor_name TEXT,
  appointment_date TIMESTAMPTZ NOT NULL,
  appointment_type TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled

  -- Conference call info
  conference_sid TEXT, -- Twilio conference ID
  recording_sid TEXT, -- Twilio recording ID
  recording_url TEXT,

  -- AI assistant tracking
  assistant_enabled BOOLEAN DEFAULT true,
  assistant_contributions INTEGER DEFAULT 0, -- number of times AI spoke

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time conversation transcript (streaming)
CREATE TABLE conversation_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  speaker TEXT NOT NULL, -- 'doctor', 'patient', 'assistant'
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  start_time FLOAT, -- seconds from start of call
  end_time FLOAT,
  confidence FLOAT, -- transcription confidence
  is_final BOOLEAN DEFAULT false, -- true when segment is finalized

  -- AI processing
  processed BOOLEAN DEFAULT false,
  triggered_ai_response BOOLEAN DEFAULT false
);

-- AI assistant interventions
CREATE TABLE assistant_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  trigger_type TEXT, -- 'clarification_needed', 'question_suggested', 'term_explained', 'concern_detected'
  context_segment_id UUID REFERENCES conversation_segments(id),
  ai_response TEXT, -- what the AI said
  response_audio_url TEXT, -- Cartesia audio file
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  patient_acknowledged BOOLEAN, -- did patient/doctor respond?
  helpful_rating INTEGER -- 1-5, filled later
);

-- Create indexes
CREATE INDEX idx_conversation_segments_appointment ON conversation_segments(appointment_id);
CREATE INDEX idx_conversation_segments_timestamp ON conversation_segments(timestamp);
CREATE INDEX idx_assistant_interventions_appointment ON assistant_interventions(appointment_id);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_interventions ENABLE ROW LEVEL SECURITY;

-- Patients can view their own appointments and transcripts
CREATE POLICY "Patients can view own appointments" ON appointments
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT id FROM patients WHERE auth0_id = auth.uid()));

CREATE POLICY "Patients can view own conversation" ON conversation_segments
  FOR SELECT TO authenticated
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE patient_id = (
        SELECT id FROM patients WHERE auth0_id = auth.uid()
      )
    )
  );

CREATE POLICY "Patients can view AI interventions" ON assistant_interventions
  FOR SELECT TO authenticated
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE patient_id = (
        SELECT id FROM patients WHERE auth0_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE conversation_segments IS 'Real-time transcript segments from live appointments';
COMMENT ON TABLE assistant_interventions IS 'AI assistant contributions during appointments';
