'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'

export default function StartAppointmentPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [callStarted, setCallStarted] = useState(false)
  const [formData, setFormData] = useState({
    doctorPhone: '',
    patientPhone: '',
    doctorName: '',
    appointmentType: 'consultation'
  })

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create appointment first
      const createResponse = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_name: formData.doctorName,
          appointment_type: formData.appointmentType,
          appointment_date: new Date().toISOString()
        })
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create appointment')
      }

      const { appointmentId } = await createResponse.json()

      console.log('process.env.NEXT_PUBLIC_VOICE_SERVER_URL', process.env.NEXT_PUBLIC_VOICE_SERVER_URL)
      // Start the conference call
      const callResponse = await fetch(
        `${process.env.NEXT_PUBLIC_VOICE_SERVER_URL}/api/appointments/${appointmentId}/start-call`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorPhone: formData.doctorPhone,
            patientPhone: formData.patientPhone
          })
        }
      )

      if (!callResponse.ok) {
        throw new Error('Failed to start call')
      }

      setCallStarted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-beige-50 to-beige-100">
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-4xl font-serif font-bold text-primary-600">
              Start AI-Assisted Appointment
            </h1>
            <p className="mt-3 text-lg text-gray-700">
              Connect a doctor and patient with Amiga's AI assistant listening and helping in real-time.
            </p>
            <div className="w-24 h-1 bg-purple-500 mt-4"></div>
          </div>

          {callStarted ? (
            <div className="bg-white shadow-lg rounded-xl border border-beige-200 p-8 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-serif font-bold text-primary-600 mb-2">
                  Calls Connecting!
                </h2>
                <p className="text-gray-700 text-lg">
                  Both doctor and patient are being called now.
                </p>
                <p className="text-gray-600 mt-4">
                  The AI assistant Amiga will join the conference and listen to help during the conversation.
                </p>
              </div>

              <div className="bg-beige-50 rounded-lg p-6 border border-beige-200">
                <h3 className="font-serif font-bold text-gray-900 mb-3">What happens next:</h3>
                <ul className="text-left space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">1.</span>
                    Doctor receives a call and joins the conference
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">2.</span>
                    Patient receives a call and joins the conference
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">3.</span>
                    AI assistant listens and can speak to clarify or help
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">4.</span>
                    Full transcript available after the call
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setCallStarted(false)
                  setFormData({
                    doctorPhone: '',
                    patientPhone: '',
                    doctorName: '',
                    appointmentType: 'consultation'
                  })
                }}
                className="mt-6 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-serif font-bold"
              >
                Start Another Appointment
              </button>
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-xl border border-beige-200 p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-md">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleStartCall} className="space-y-6">
                <div>
                  <label htmlFor="doctorName" className="block text-sm font-bold text-gray-700 mb-2">
                    Doctor's Name *
                  </label>
                  <input
                    type="text"
                    id="doctorName"
                    required
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Dr. Smith"
                  />
                </div>

                <div>
                  <label htmlFor="doctorPhone" className="block text-sm font-bold text-gray-700 mb-2">
                    Doctor's Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="doctorPhone"
                    required
                    value={formData.doctorPhone}
                    onChange={(e) => setFormData({ ...formData, doctorPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+1234567890"
                  />
                  <p className="mt-1 text-sm text-gray-600">Include country code (e.g., +1 for US)</p>
                </div>

                <div>
                  <label htmlFor="patientPhone" className="block text-sm font-bold text-gray-700 mb-2">
                    Patient's Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="patientPhone"
                    required
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label htmlFor="appointmentType" className="block text-sm font-bold text-gray-700 mb-2">
                    Appointment Type *
                  </label>
                  <select
                    id="appointmentType"
                    required
                    value={formData.appointmentType}
                    onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                    className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="consultation">Initial Consultation</option>
                    <option value="follow-up">Follow-up Visit</option>
                    <option value="treatment-planning">Treatment Planning</option>
                    <option value="results-review">Results Review</option>
                  </select>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <h3 className="font-serif font-bold text-purple-900 mb-2 flex items-center">
                    AI Assistant Features
                  </h3>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Clarifies complex medical terms in real-time</li>
                    <li>• Suggests questions the patient might want to ask</li>
                    <li>• Provides emotional support when needed</li>
                    <li>• Takes automated notes</li>
                    <li>• Creates full transcript for later review</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all shadow-md font-serif font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Starting Call...' : 'Start AI-Assisted Appointment'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
