-- Replace the single auth0_id column with a join table for many-to-many
CREATE TABLE IF NOT EXISTS clinic_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  auth0_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clinic_id, auth0_id)
);

-- Migrate any existing auth0_id values
INSERT INTO clinic_providers (clinic_id, auth0_id)
SELECT id, auth0_id FROM clinics WHERE auth0_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE clinics DROP COLUMN IF EXISTS auth0_id;
