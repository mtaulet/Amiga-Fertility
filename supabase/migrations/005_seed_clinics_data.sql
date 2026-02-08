-- Seed clinics data
INSERT INTO clinics (name, locations, size, years_experience, expertise, description, price_range) VALUES
(
  'Instituto Vida',
  '["Madrid", "Barcelona", "Alicante"]'::jsonb,
  300,
  40,
  '["Donor Eggs", "Embryo Adoption", "Donor Sperm", "IVF", "Fertility preservation", "IUI"]'::jsonb,
  'Very well established clinic, older, a bit of a high throughput, lots of volume, lots of patients.',
  'low'
),
(
  'IVF Now',
  '["Madrid"]'::jsonb,
  10,
  5,
  '["IVF", "Fertility preservation", "IUI", "Holistic"]'::jsonb,
  'Newish, more modern, targets international patients only, no own egg bank, no own labs.',
  'med-high'
),
(
  'Calatrava',
  '["Barcelona", "Madrid"]'::jsonb,
  25,
  30,
  '["IVF", "Fertility preservation", "IUI"]'::jsonb,
  'Very established but has not expanded much. Patient oriented. Family clinic. Smaller but mighty. Safety awards.',
  'low'
),
(
  'Bebeya',
  '["Alicante"]'::jsonb,
  100,
  34,
  '["IVF", "Fertility preservation", "IUI"]'::jsonb,
  'Established clinic.',
  'low'
),
(
  'Maria',
  '["Malaga", "Madrid"]'::jsonb,
  20,
  10,
  '["IVF", "Fertility preservation", "IUI"]'::jsonb,
  NULL,
  'med'
),
(
  'Milagros',
  '["Madrid", "Alicante", "Malaga"]'::jsonb,
  200,
  40,
  '["Diminished Ovarian Reserve (DOR)", "Low AMH", "IVF", "Fertility preservation", "IUI"]'::jsonb,
  'Experience, lots of academic research, awarded, fast pace, low personalization, high throughput.',
  'low'
),
(
  'Gaudi Clinic',
  '["Barcelona"]'::jsonb,
  50,
  21,
  '["IVF", "Fertility preservation", "IUI", "Endometriosis"]'::jsonb,
  NULL,
  'med-high'
),
(
  'ReproTeams',
  '["Madrid", "Barcelona", "Portugal"]'::jsonb,
  50,
  10,
  '["IVF", "Fertility preservation", "IUI", "Non anonymous donations"]'::jsonb,
  'Non anonymous donations.',
  'med'
);

-- Verify insert
SELECT
  name,
  jsonb_array_length(locations) as location_count,
  jsonb_array_length(expertise) as expertise_count,
  price_range
FROM clinics
ORDER BY name;
