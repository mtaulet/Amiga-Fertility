import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const session = await auth0.getSession()

  if (!session) {
    redirect('/login')
  }

  // Check if patient has completed intake
  const { data: patient } = await supabaseAdmin
    .from('patients')
    .select('intake_completed')
    .eq('auth0_id', session.user.sub)
    .single()

  // Redirect to intake if not completed
  if (!patient || !patient.intake_completed) {
    redirect('/intake')
  }

  const user = session.user

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-beige-50 to-beige-100">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-10">
              <h1 className="text-4xl font-serif font-bold text-primary-600">
                Welcome back, {user.name || 'Patient'}
              </h1>
              <p className="mt-3 text-lg text-gray-700 font-serif">
                Your personalized fertility journey dashboard
              </p>
              <div className="w-24 h-1 bg-purple-500 mt-4"></div>
            </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Appointments Card */}
            <div className="bg-white overflow-hidden shadow-md rounded-xl border border-beige-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-primary-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">
                        Upcoming Appointments
                      </dt>
                      <dd className="text-2xl font-serif font-bold text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-beige-50 px-6 py-4 border-t border-beige-200">
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-serif font-bold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Schedule appointment →
                  </a>
                </div>
              </div>
            </div>

            {/* Messages Card */}
            <div className="bg-white overflow-hidden shadow-md rounded-xl border border-beige-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-primary-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">
                        New Messages
                      </dt>
                      <dd className="text-2xl font-serif font-bold text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-beige-50 px-6 py-4 border-t border-beige-200">
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-serif font-bold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    View messages →
                  </a>
                </div>
              </div>
            </div>

            {/* Documents Card */}
            <div className="bg-white overflow-hidden shadow-md rounded-xl border border-beige-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-primary-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">
                        Documents
                      </dt>
                      <dd className="text-2xl font-serif font-bold text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-beige-50 px-6 py-4 border-t border-beige-200">
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-serif font-bold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    View documents →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-12">
            <h2 className="text-2xl font-serif font-bold text-primary-600 mb-6">
              Quick Actions
            </h2>
            <div className="bg-white shadow-md overflow-hidden rounded-xl border border-beige-200">
              <ul className="divide-y divide-beige-200">
                <li>
                  <a
                    href="#"
                    className="block hover:bg-beige-50 px-6 py-5 sm:px-8 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-serif font-bold text-primary-600">
                          Complete your medical history
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          Help us provide better care by completing your profile
                        </p>
                      </div>
                      <div className="ml-5 flex-shrink-0">
                        <svg
                          className="h-6 w-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </main>
    </>
  )
}
