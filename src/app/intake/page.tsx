'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FormData {
  first_name: string
  last_name: string
  preferred_name: string
  date_of_birth: string
  phone_number: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  timezone: string
  partner_name: string
  partner_email: string
  partner_phone: string
  fertility_goals: string[]
  health_concerns: string[]
  treatment_timeline: string
  past_experience: string
  referral_source: string
  terms_accepted: boolean
}

export default function IntakePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    preferred_name: '',
    date_of_birth: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    partner_name: '',
    partner_email: '',
    partner_phone: '',
    fertility_goals: [],
    health_concerns: [],
    treatment_timeline: '',
    past_experience: '',
    referral_source: '',
    terms_accepted: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox' && 'checked' in e.target) {
      setFormData(prev => ({ ...prev, [name]: e.target.checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleCheckboxArrayChange = (field: 'fertility_goals' | 'health_concerns', value: string) => {
    setFormData(prev => {
      const currentArray = prev[field]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
      return { ...prev, [field]: newArray }
    })
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const response = await fetch('/api/intake/demographics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.details) {
          // Zod validation errors
          const fieldErrors: Record<string, string> = {}
          data.details.forEach((err: any) => {
            fieldErrors[err.path[0]] = err.message
          })
          setErrors(fieldErrors)
        } else {
          throw new Error(data.error || 'Failed to submit form')
        }
        return
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ _form: 'An error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-beige-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Amiga Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-serif font-bold text-primary-500 mb-2">
            amiga<br />fertility
          </h1>
        </div>

        <div className="bg-white shadow-lg sm:rounded-xl border border-beige-200">
          <div className="px-6 py-8 sm:p-10">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              Welcome to Amiga Fertility
            </h2>
            <p className="text-gray-700 mb-8 text-lg">
              Let's start by collecting some basic information to personalize your experience.
            </p>

            {errors._form && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-md">
                <p className="text-sm text-red-700 font-medium">{errors._form}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div className="border-t border-beige-200 pt-8">
                <h3 className="text-2xl font-serif font-bold text-primary-600 mb-6">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="preferred_name" className="block text-sm font-medium text-gray-700">
                      Preferred Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="preferred_name"
                      name="preferred_name"
                      value={formData.preferred_name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    />
                    {errors.date_of_birth && (
                      <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="border-t border-beige-200 pt-8">
                <h3 className="text-2xl font-serif font-bold text-primary-600 mb-6">Contact Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                      Phone Number * <span className="text-gray-500 text-xs">(Include country code, e.g., +1)</span>
                    </label>
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="+1234567890"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    />
                    {errors.phone_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      id="address_line1"
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    />
                    {errors.address_line1 && (
                      <p className="mt-1 text-sm text-red-600">{errors.address_line1}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      id="address_line2"
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                        State/Province *
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                      />
                      {errors.state && (
                        <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        id="postal_code"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                      />
                      {errors.postal_code && (
                        <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    />
                    {errors.country && (
                      <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Partner Information Section */}
              <div className="border-t border-beige-200 pt-8">
                <h3 className="text-2xl font-serif font-bold text-primary-600 mb-3">Partner Information (Optional)</h3>
                <p className="text-base text-gray-700 mb-6">
                  If you have a partner involved in your fertility journey, please share their information.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="partner_name" className="block text-sm font-medium text-gray-700">
                      Partner's Name
                    </label>
                    <input
                      type="text"
                      id="partner_name"
                      name="partner_name"
                      value={formData.partner_name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div>
                    <label htmlFor="partner_email" className="block text-sm font-medium text-gray-700">
                      Partner's Email
                    </label>
                    <input
                      type="email"
                      id="partner_email"
                      name="partner_email"
                      value={formData.partner_email}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    />
                    {errors.partner_email && (
                      <p className="mt-1 text-sm text-red-600">{errors.partner_email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="partner_phone" className="block text-sm font-medium text-gray-700">
                      Partner's Phone
                    </label>
                    <input
                      type="tel"
                      id="partner_phone"
                      name="partner_phone"
                      value={formData.partner_phone}
                      onChange={handleChange}
                      placeholder="+1234567890"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    />
                    {errors.partner_phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.partner_phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fertility-Specific Questions Section */}
              <div className="border-t-2 border-purple-300 pt-8">
                <h3 className="text-2xl font-serif font-bold text-purple-600 mb-6">Your Fertility Journey</h3>

                {/* What are you looking for? */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What are you looking for? *
                  </label>
                  <div className="space-y-2">
                    {[
                      'In Vitro Fertilization (IVF)',
                      'Intrauterine Insemination (IUI)',
                      'Egg Freezing',
                      'Embryo Freezing',
                      'Genetic Testing',
                      'Fertility Assessment',
                      'Donor Services',
                      'Surrogacy Services'
                    ].map((option) => (
                      <div key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`fertility_goal_${option}`}
                          checked={formData.fertility_goals.includes(option)}
                          onChange={() => handleCheckboxArrayChange('fertility_goals', option)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`fertility_goal_${option}`}
                          className="ml-3 text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.fertility_goals && (
                    <p className="mt-1 text-sm text-red-600">{errors.fertility_goals}</p>
                  )}
                </div>

                {/* Are you concerned about? */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Are you concerned about...? (Optional)
                  </label>
                  <div className="space-y-2">
                    {[
                      'Polycystic Ovary Syndrome (PCOS)',
                      'Endometriosis',
                      'Low Ovarian Reserve',
                      'Male Factor Infertility',
                      'Recurrent Pregnancy Loss',
                      'Advanced Maternal Age',
                      'Unexplained Infertility'
                    ].map((option) => (
                      <div key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`health_concern_${option}`}
                          checked={formData.health_concerns.includes(option)}
                          onChange={() => handleCheckboxArrayChange('health_concerns', option)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`health_concern_${option}`}
                          className="ml-3 text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.health_concerns && (
                    <p className="mt-1 text-sm text-red-600">{errors.health_concerns}</p>
                  )}
                </div>

                {/* Treatment Timeline */}
                <div className="mb-6">
                  <label htmlFor="treatment_timeline" className="block text-sm font-medium text-gray-700">
                    What is your desired time frame for the treatment? *
                  </label>
                  <input
                    type="text"
                    id="treatment_timeline"
                    name="treatment_timeline"
                    value={formData.treatment_timeline}
                    onChange={handleChange}
                    placeholder="e.g., Within 3 months, 6-12 months, Just exploring options"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  />
                  {errors.treatment_timeline && (
                    <p className="mt-1 text-sm text-red-600">{errors.treatment_timeline}</p>
                  )}
                </div>

                {/* Past Experience */}
                <div className="mb-6">
                  <label htmlFor="past_experience" className="block text-sm font-medium text-gray-700">
                    Tell us a bit more: What have you tried in the past? What has been the biggest challenge? How could we assist you best? *
                  </label>
                  <textarea
                    id="past_experience"
                    name="past_experience"
                    value={formData.past_experience}
                    onChange={handleChange}
                    rows={5}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    placeholder="Please share your fertility journey so far..."
                  />
                  {errors.past_experience && (
                    <p className="mt-1 text-sm text-red-600">{errors.past_experience}</p>
                  )}
                </div>

                {/* Referral Source */}
                <div className="mb-6">
                  <label htmlFor="referral_source" className="block text-sm font-medium text-gray-700">
                    How did you hear about Amiga Fertility? *
                  </label>
                  <input
                    type="text"
                    id="referral_source"
                    name="referral_source"
                    value={formData.referral_source}
                    onChange={handleChange}
                    placeholder="e.g., Google search, Friend referral, Social media, Doctor recommendation"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  />
                  {errors.referral_source && (
                    <p className="mt-1 text-sm text-red-600">{errors.referral_source}</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div>
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms_accepted"
                      name="terms_accepted"
                      checked={formData.terms_accepted}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="terms_accepted" className="ml-3 text-sm text-gray-700">
                      I accept the{' '}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-500 underline"
                      >
                        Terms and Conditions
                      </a>{' '}
                      and understand that my information will be used to provide personalized fertility care services. *
                    </label>
                  </div>
                  {errors.terms_accepted && (
                    <p className="mt-1 text-sm text-red-600">{errors.terms_accepted}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-8 border-t border-beige-200">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center py-3 px-8 border border-transparent shadow-md text-base font-serif font-bold rounded-lg text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isSubmitting ? 'Saving...' : 'Complete Setup'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
