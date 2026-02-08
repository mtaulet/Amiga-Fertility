export interface Patient {
  id: string
  auth0_id: string
  email: string
  first_name: string | null
  last_name: string | null
  preferred_name: string | null
  date_of_birth: string | null
  phone_number: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  timezone: string | null
  partner_name: string | null
  partner_email: string | null
  partner_phone: string | null
  fertility_goals: string[] | null
  health_concerns: string[] | null
  treatment_timeline: string | null
  past_experience: string | null
  referral_source: string | null
  terms_accepted: boolean
  terms_accepted_at: string | null
  intake_completed: boolean
  intake_completed_at: string | null
  created_at: string
  updated_at: string
}

export interface PatientProfile {
  id: string
  patient_id: string
  medical_history: Record<string, any> | null
  medications: Record<string, any> | null
  allergies: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  clinic_name: string
  appointment_date: string
  appointment_type: string
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  patient_id: string
  document_name: string
  document_type: string
  file_url: string
  uploaded_at: string
  created_at: string
}

export interface Message {
  id: string
  patient_id: string
  sender_type: 'patient' | 'clinic' | 'admin'
  subject: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Clinic {
  id: string
  name: string
  locations: string[]
  size: number | null
  years_experience: number
  expertise: string[]
  description: string | null
  price_range: 'low' | 'med' | 'med-high' | 'high' | null
  created_at: string
  updated_at: string
}

// Form-specific type for demographics intake
export interface DemographicsFormData {
  first_name: string
  last_name: string
  preferred_name?: string
  date_of_birth: string
  phone_number: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  timezone: string
  partner_name?: string
  partner_email?: string
  partner_phone?: string
  fertility_goals: string[]
  health_concerns: string[]
  treatment_timeline: string
  past_experience: string
  referral_source: string
  terms_accepted: boolean
}
