export interface Patient {
  id: string
  auth0_id: string
  email: string
  first_name: string | null
  last_name: string | null
  preferred_name: string | null
  date_of_birth: string | null
  sex: string | null
  phone_number: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  timezone: string | null
  partner_name: string | null
  partner_last_name: string | null
  partner_email: string | null
  partner_phone: string | null
  partner_sex: string | null
  partner_dob: string | null
  fertility_goals: string[] | null
  health_concerns: string[] | null
  treatment_timeline: string | null
  last_period_date: string | null
  cycle_duration_days: number | null
  regular_cycles: boolean | null
  on_birth_control: boolean | null
  storage_duration: string | null
  treatment_type: string | null
  doctor_preference: string | null
  preference_rank: string[] | null
  treatment_urgency: boolean | null
  treatment_constraints: string | null
  past_experience: string | null
  referral_source: string | null
  terms_accepted: boolean
  terms_accepted_at: string | null
  intake_completed: boolean
  intake_completed_at: string | null
  clinic_selection_confirmed_at: string | null
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
  clinic_id: string | null
  clinic_name: string | null
  doctor_name: string | null
  appointment_date: string
  appointment_type: string | null
  status: string
  notes: string | null
  conference_sid: string | null
  recording_sid: string | null
  recording_url: string | null
  assistant_enabled: boolean | null
  assistant_contributions: number | null
  audio_file_url: string | null
  audio_uploaded_at: string | null
  transcript_text: string | null
  transcript_generated_at: string | null
  transcript_reviewed_at: string | null
  communications_text: string | null
  communications_updated_at: string | null
  communications_summary: string | null
  communications_summary_reviewed_at: string | null
  generated_summary: string | null
  generated_summary_reviewed_at: string | null
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
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface PatientClinicSelection {
  id: string
  patient_id: string
  clinic_id: string
  selection_type: 'patient' | 'downselection'
  slot_position: 1 | 2
  note: string | null
  created_at: string
  updated_at: string
}

// Form-specific type for demographics intake
export interface DemographicsFormData {
  first_name: string
  last_name: string
  preferred_name?: string
  date_of_birth: string
  sex?: string
  phone_number: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  timezone: string
  partner_name?: string
  partner_last_name?: string
  partner_email?: string
  partner_phone?: string
  partner_sex?: string
  partner_dob?: string
  fertility_goals: string[]
  health_concerns: string[]
  treatment_timeline: string
  last_period_date?: string
  cycle_duration_days?: number
  regular_cycles?: boolean
  on_birth_control?: boolean
  storage_duration?: string
  treatment_type?: string
  doctor_preference?: string
  preference_rank?: string[]
  treatment_urgency?: boolean
  treatment_constraints?: string
  past_experience: string
  referral_source: string
  terms_accepted: boolean
}
