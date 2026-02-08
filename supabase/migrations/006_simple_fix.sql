-- Simple migration: Add only what's missing
-- Run this in Supabase SQL Editor

-- Add missing columns to appointments table (will skip if they exist)
DO $$
BEGIN
  -- Add clinic_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='appointments' AND column_name='clinic_id') THEN
    ALTER TABLE appointments ADD COLUMN clinic_id UUID;
  END IF;

  -- Add doctor_name if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='appointments' AND column_name='doctor_name') THEN
    ALTER TABLE appointments ADD COLUMN doctor_name TEXT;
  END IF;

  -- Add appointment_type if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='appointments' AND column_name='appointment_type') THEN
    ALTER TABLE appointments ADD COLUMN appointment_type TEXT;
  END IF;

  -- Add conference_sid if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='appointments' AND column_name='conference_sid') THEN
    ALTER TABLE appointments ADD COLUMN conference_sid TEXT;
  END IF;

  -- Add recording_sid if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='appointments' AND column_name='recording_sid') THEN
    ALTER TABLE appointments ADD COLUMN recording_sid TEXT;
  END IF;

  -- Add recording_url if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='appointments' AND column_name='recording_url') THEN
    ALTER TABLE appointments ADD COLUMN recording_url TEXT;
  END IF;

  -- Add assistant_enabled if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='appointments' AND column_name='assistant_enabled') THEN
    ALTER TABLE appointments ADD COLUMN assistant_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Add assistant_contributions if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='appointments' AND column_name='assistant_contributions') THEN
    ALTER TABLE appointments ADD COLUMN assistant_contributions INTEGER DEFAULT 0;
  END IF;

  -- Add started_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='appointments' AND column_name='started_at') THEN
    ALTER TABLE appointments ADD COLUMN started_at TIMESTAMPTZ;
  END IF;

  -- Add ended_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='appointments' AND column_name='ended_at') THEN
    ALTER TABLE appointments ADD COLUMN ended_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create conversation_segments table
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

-- Simple policies: service role can do everything
DO $$
BEGIN
  EXECUTE 'CREATE POLICY service_role_all_conversation ON conversation_segments FOR ALL TO service_role USING (true) WITH CHECK (true)';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'CREATE POLICY service_role_all_interventions ON assistant_interventions FOR ALL TO service_role USING (true) WITH CHECK (true)';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

SELECT 'Migration completed! Added all missing columns and tables.' as status;
