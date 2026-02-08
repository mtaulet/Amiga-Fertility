-- Fixed migration: Add missing columns and tables
-- Run this in Supabase SQL Editor

-- Step 1: Add AI assistant columns to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS conference_sid TEXT,
ADD COLUMN IF NOT EXISTS recording_sid TEXT,
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS assistant_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS assistant_contributions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Step 2: Create conversation_segments table
CREATE TABLE IF NOT EXISTS conversation_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  start_time FLOAT,
  end_time FLOAT,
  confidence FLOAT,
  is_final BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  triggered_ai_response BOOLEAN DEFAULT false
);

-- Step 3: Create assistant_interventions table
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

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_conversation_segments_appointment ON conversation_segments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_conversation_segments_timestamp ON conversation_segments(timestamp);
CREATE INDEX IF NOT EXISTS idx_assistant_interventions_appointment ON assistant_interventions(appointment_id);

-- Step 5: Enable RLS
ALTER TABLE conversation_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_interventions ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop old policies if they exist (won't error if they don't)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role full access to conversation" ON conversation_segments;
  DROP POLICY IF EXISTS "Service role full access to interventions" ON assistant_interventions;
  DROP POLICY IF EXISTS "Patients can view own conversation" ON conversation_segments;
  DROP POLICY IF EXISTS "Patients can view AI interventions" ON assistant_interventions;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore errors if policies don't exist
END $$;

-- Step 7: Create new policies
CREATE POLICY "Service role full access to conversation" ON conversation_segments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to interventions" ON assistant_interventions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Patients can view own conversation" ON conversation_segments
  FOR SELECT TO authenticated
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE patient_id IN (
        SELECT id FROM patients WHERE auth0_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

CREATE POLICY "Patients can view AI interventions" ON assistant_interventions
  FOR SELECT TO authenticated
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE patient_id IN (
        SELECT id FROM patients WHERE auth0_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

SELECT 'Migration completed successfully!' as status;
