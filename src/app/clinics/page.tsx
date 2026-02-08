import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Clinic } from '@/lib/supabase/types'

export default async function ClinicsPage() {
  const session = await auth0.getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch all clinics
  const { data: clinics, error } = await supabaseAdmin
    .from('clinics')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching clinics:', error)
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-beige-50 to-beige-100">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-10">
              <h1 className="text-4xl font-serif font-bold text-primary-600">
                Fertility Clinics
              </h1>
              <p className="mt-3 text-lg text-gray-700">
                Explore fertility clinics that match your needs
              </p>
              <div className="w-24 h-1 bg-purple-500 mt-4"></div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-md">
                <p className="text-sm text-red-700 font-medium">
                  Error loading clinics. Please try again later.
                </p>
              </div>
            )}

            {!clinics || clinics.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md border border-beige-200">
                <p className="text-gray-600 text-lg">No clinics found. Please run the database migrations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {clinics.map((clinic: Clinic) => (
                  <div
                    key={clinic.id}
                    className="bg-white overflow-hidden shadow-md rounded-xl border border-beige-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <h2 className="text-2xl font-serif font-bold text-primary-600 mb-3">
                        {clinic.name}
                      </h2>

                      {/* Locations */}
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Locations</h3>
                        <div className="flex flex-wrap gap-2">
                          {clinic.locations.map((location) => (
                            <span
                              key={location}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-beige-100 text-gray-800"
                            >
                              📍 {location}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Experience & Size */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Experience</p>
                          <p className="text-lg font-serif font-bold text-gray-900">
                            {clinic.years_experience} years
                          </p>
                        </div>
                        {clinic.size && (
                          <div>
                            <p className="text-sm text-gray-600">Size</p>
                            <p className="text-lg font-serif font-bold text-gray-900">
                              {clinic.size} staff
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Expertise */}
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                          {clinic.expertise.map((exp) => (
                            <span
                              key={exp}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      {clinic.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 italic">
                            {clinic.description}
                          </p>
                        </div>
                      )}

                      {/* Price Range */}
                      {clinic.price_range && (
                        <div className="flex items-center justify-between pt-4 border-t border-beige-200">
                          <span className="text-sm font-medium text-gray-600">Price Range</span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary-100 text-primary-700 uppercase">
                            {clinic.price_range}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
