-- Create clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  locations JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of city names
  size INTEGER, -- Number of staff/capacity
  years_experience INTEGER NOT NULL,
  expertise JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of treatment types
  description TEXT, -- Marketing description/notes
  price_range TEXT CHECK (price_range IN ('low', 'med', 'med-high', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for searching by location
CREATE INDEX idx_clinics_locations ON clinics USING gin(locations);

-- Create index for searching by expertise
CREATE INDEX idx_clinics_expertise ON clinics USING gin(expertise);

-- Create index for filtering by price range
CREATE INDEX idx_clinics_price_range ON clinics(price_range);

-- Enable Row Level Security
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Create policy: all authenticated users can read clinics
CREATE POLICY "Authenticated users can read clinics" ON clinics
  FOR SELECT TO authenticated
  USING (true);

-- Create policy: only admins can insert/update/delete clinics (we'll add admin role later)
CREATE POLICY "Only admins can modify clinics" ON clinics
  FOR ALL
  USING (false); -- For now, no one can modify via RLS (use service role)

-- Add comments for documentation
COMMENT ON TABLE clinics IS 'Fertility clinics available for patient recommendations';
COMMENT ON COLUMN clinics.locations IS 'Array of city names where clinic has offices';
COMMENT ON COLUMN clinics.expertise IS 'Array of treatment types and specialties offered';
COMMENT ON COLUMN clinics.description IS 'Marketing description and clinic characteristics';
COMMENT ON COLUMN clinics.price_range IS 'Price range: low, med, med-high, or high';
