-- Add new demographic fields to patients table
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS preferred_name TEXT,
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS partner_name TEXT,
  ADD COLUMN IF NOT EXISTS partner_email TEXT,
  ADD COLUMN IF NOT EXISTS partner_phone TEXT,
  ADD COLUMN IF NOT EXISTS intake_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMPTZ;

-- Create index on intake_completed for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_intake_completed ON patients(intake_completed);

-- Update RLS policy to allow patients to insert their own data
CREATE POLICY "Patients can insert their own data" ON patients
  FOR INSERT WITH CHECK (auth0_id = current_setting('app.current_user_auth0_id', true));
