-- Fix: Make clinic_name nullable since it's not always provided
-- Run this in Supabase SQL Editor

-- Remove NOT NULL constraint from clinic_name
ALTER TABLE appointments
ALTER COLUMN clinic_name DROP NOT NULL;

SELECT 'Fixed clinic_name constraint!' as status;
