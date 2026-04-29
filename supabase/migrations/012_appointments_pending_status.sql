-- Expand the status check constraint to include 'pending'
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'scheduled', 'confirmed', 'in_progress', 'cancelled', 'completed'));
