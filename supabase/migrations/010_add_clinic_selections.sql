ALTER TABLE clinics ADD COLUMN IF NOT EXISTS photo_url TEXT;

CREATE TABLE patient_clinic_selections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id     UUID REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id      UUID REFERENCES clinics(id),
  selection_type TEXT NOT NULL CHECK (selection_type IN ('patient', 'downselection')),
  slot_position  INTEGER NOT NULL CHECK (slot_position IN (1, 2)),
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, selection_type, slot_position)
);

ALTER TABLE patient_clinic_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients manage own clinic selections" ON patient_clinic_selections
  FOR ALL
  USING (patient_id = (SELECT id FROM patients WHERE auth0_id = current_setting('app.current_user_auth0_id', true)));

ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_selection_confirmed_at TIMESTAMPTZ;
