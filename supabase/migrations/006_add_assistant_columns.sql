-- Quick fix: Add missing columns to existing appointments table
-- Run this in Supabase SQL Editor

-- Add AI assistant columns to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS conference_sid TEXT,
ADD COLUMN IF NOT EXISTS recording_sid TEXT,
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS assistant_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS assistant_contributions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Create conversation_segments table
CREATE TABLE IF NOT EXISTS conversation_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  speaker TEXT NOT NULL, -- 'doctor', 'patient', 'assistant'
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  start_time FLOAT, -- seconds from start of call
  end_time FLOAT,
  confidence FLOAT, -- transcription confidence
  is_final BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  triggered_ai_response BOOLEAN DEFAULT false
);

-- Create assistant_interventions table
CREATE TABLE IF NOT EXISTS assistant_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  trigger_type TEXT,
  context_segment_id UUID REFERENCES conversation_segments(id),
  ai_response TEXT,
  response_audio_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  patient_acknowledged BOOLEAN,
  helpful_rating INTEGER
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversation_segments_appointment ON conversation_segments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_conversation_segments_timestamp ON conversation_segments(timestamp);
CREATE INDEX IF NOT EXISTS idx_assistant_interventions_appointment ON assistant_interventions(appointment_id);

-- Enable RLS
ALTER TABLE conversation_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_interventions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Patients can view own conversation" ON conversation_segments;
CREATE POLICY "Patients can view own conversation" ON conversation_segments
  FOR SELECT TO authenticated
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE patient_id = (
        SELECT id FROM patients WHERE auth0_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Patients can view AI interventions" ON assistant_interventions;
CREATE POLICY "Patients can view AI interventions" ON assistant_interventions
  FOR SELECT TO authenticated
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE patient_id = (
        SELECT id FROM patients WHERE auth0_id = auth.uid()
      )
    )
  );

SELECT 'Migration completed successfully!' as status;
