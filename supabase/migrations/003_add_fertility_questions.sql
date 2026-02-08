-- Add fertility-specific fields to patients table
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS fertility_goals JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS health_concerns JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS treatment_timeline TEXT,
  ADD COLUMN IF NOT EXISTS past_experience TEXT,
  ADD COLUMN IF NOT EXISTS referral_source TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN patients.fertility_goals IS 'Array of selected fertility treatment goals (IVF, IUI, egg freezing, etc.)';
COMMENT ON COLUMN patients.health_concerns IS 'Array of selected health concerns (PCOS, endometriosis, etc.)';
COMMENT ON COLUMN patients.treatment_timeline IS 'Patient''s desired timeframe for treatment';
COMMENT ON COLUMN patients.past_experience IS 'Patient''s past fertility experiences and challenges';
COMMENT ON COLUMN patients.referral_source IS 'How the patient heard about Amiga Fertility';
COMMENT ON COLUMN patients.terms_accepted IS 'Whether patient accepted terms and conditions';
COMMENT ON COLUMN patients.terms_accepted_at IS 'Timestamp when terms were accepted';
