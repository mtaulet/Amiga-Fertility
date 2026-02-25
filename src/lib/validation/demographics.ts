import { z } from 'zod'

const booleanFromString = z.preprocess((val) => {
  if (val === 'yes') return true
  if (val === 'no') return false
  return val
}, z.boolean().optional())

export const demographicsSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  preferred_name: z.string().max(100).optional(),
  date_of_birth: z.string().refine((date) => {
    const dob = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - dob.getFullYear()
    return age >= 18 && age <= 120
  }, 'Must be at least 18 years old'),
  sex: z.string().max(50).optional(),
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  address_line1: z.string().min(1, 'Address is required').max(200),
  address_line2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State/Province is required').max(100),
  postal_code: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().min(1, 'Country is required').max(100),
  timezone: z.string().min(1, 'Timezone is required'),
  partner_name: z.string().max(100).optional(),
  partner_last_name: z.string().max(100).optional(),
  partner_email: z.string().email('Invalid email format').optional().or(z.literal('')),
  partner_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format').optional().or(z.literal('')),
  partner_sex: z.string().max(50).optional(),
  partner_dob: z.string().optional(),
  fertility_goals: z.array(z.string()).min(1, 'Please select at least one treatment goal'),
  health_concerns: z.array(z.string()),
  treatment_timeline: z.string().min(1, 'Please provide your desired treatment timeline').max(500),
  last_period_date: z.string().optional(),
  cycle_duration_days: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().min(1).max(60).optional()
  ),
  regular_cycles: booleanFromString,
  on_birth_control: booleanFromString,
  storage_duration: z.string().max(100).optional(),
  treatment_type: z.enum(['onsite', 'remote', 'hybrid']).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  doctor_preference: z.string().max(50).optional(),
  preference_rank: z.array(z.string()).optional(),
  treatment_urgency: booleanFromString,
  treatment_constraints: z.string().max(500).optional(),
  past_experience: z.string().min(1, 'Please share your experience and how we can help').max(2000),
  referral_source: z.string().min(1, 'Please let us know how you heard about us').max(200),
  terms_accepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
})

export type DemographicsFormData = z.infer<typeof demographicsSchema>
