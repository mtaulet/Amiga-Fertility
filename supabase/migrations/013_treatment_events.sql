CREATE TABLE treatment_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  date         DATE NOT NULL,
  task         TEXT NOT NULL,
  goal         TEXT,
  detail       TEXT,
  event_type   TEXT NOT NULL DEFAULT 'other'
               CHECK (event_type IN ('medication','injection','clinic','trigger','retrieval','other')),
  sort_order   INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_treatment_events_patient_date ON treatment_events(patient_id, date);

ALTER TABLE treatment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own treatment events" ON treatment_events
  FOR ALL
  USING (patient_id = (SELECT id FROM patients WHERE auth0_id = current_setting('app.current_user_auth0_id', true)));

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS treatment_generated_at TIMESTAMPTZ;
