-- Add new profile fields to patients table
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS sex TEXT,
  ADD COLUMN IF NOT EXISTS partner_last_name TEXT,
  ADD COLUMN IF NOT EXISTS partner_sex TEXT,
  ADD COLUMN IF NOT EXISTS partner_dob DATE,
  ADD COLUMN IF NOT EXISTS last_period_date DATE,
  ADD COLUMN IF NOT EXISTS cycle_duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS regular_cycles BOOLEAN,
  ADD COLUMN IF NOT EXISTS on_birth_control BOOLEAN,
  ADD COLUMN IF NOT EXISTS storage_duration TEXT,
  ADD COLUMN IF NOT EXISTS treatment_type TEXT,
  ADD COLUMN IF NOT EXISTS doctor_preference TEXT,
  ADD COLUMN IF NOT EXISTS preference_rank JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS treatment_urgency BOOLEAN,
  ADD COLUMN IF NOT EXISTS treatment_constraints TEXT;

COMMENT ON COLUMN patients.sex IS 'Patient biological sex / gender identity';
COMMENT ON COLUMN patients.partner_last_name IS 'Partner last name';
COMMENT ON COLUMN patients.partner_sex IS 'Partner biological sex / gender identity';
COMMENT ON COLUMN patients.partner_dob IS 'Partner date of birth';
COMMENT ON COLUMN patients.last_period_date IS 'Date of last menstrual period';
COMMENT ON COLUMN patients.cycle_duration_days IS 'Average menstrual cycle duration in days';
COMMENT ON COLUMN patients.regular_cycles IS 'Whether menstrual cycles are regular';
COMMENT ON COLUMN patients.on_birth_control IS 'Whether patient is currently on birth control';
COMMENT ON COLUMN patients.storage_duration IS 'Desired storage duration for frozen eggs/embryos';
COMMENT ON COLUMN patients.treatment_type IS 'Preferred treatment setting: onsite, remote, or hybrid';
COMMENT ON COLUMN patients.doctor_preference IS 'Preferred doctor gender or type';
COMMENT ON COLUMN patients.preference_rank IS 'Ordered array of clinic selection priorities (e.g. Budget, Patient care, High throughput)';
COMMENT ON COLUMN patients.treatment_urgency IS 'Whether treatment timing is urgent';
COMMENT ON COLUMN patients.treatment_constraints IS 'Any constraints on treatment timeline (travel, work, etc.)';
