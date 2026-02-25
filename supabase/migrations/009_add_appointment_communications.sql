ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS audio_file_url TEXT,
  ADD COLUMN IF NOT EXISTS audio_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transcript_text TEXT,
  ADD COLUMN IF NOT EXISTS transcript_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transcript_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS communications_text TEXT,
  ADD COLUMN IF NOT EXISTS communications_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS communications_summary TEXT,
  ADD COLUMN IF NOT EXISTS communications_summary_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS generated_summary TEXT,
  ADD COLUMN IF NOT EXISTS generated_summary_reviewed_at TIMESTAMPTZ;
