CREATE TABLE appointment_availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id    UUID REFERENCES clinics(id),
  slots        JSONB NOT NULL DEFAULT '[]',
  note         TEXT,
  timezone     TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointment_availability_patient ON appointment_availability(patient_id);

ALTER TABLE appointment_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own availability" ON appointment_availability
  FOR ALL
  USING (patient_id = (SELECT id FROM patients WHERE auth0_id = current_setting('app.current_user_auth0_id', true)));
