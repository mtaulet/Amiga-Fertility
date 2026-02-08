import Navigation from '@/components/Navigation'
import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'

export default async function Home() {
  // If user is logged in, redirect to dashboard
  const session = await auth0.getSession()
  if (session) {
    redirect('/dashboard')
  }

  return (
    <>
      <Navigation />
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-b from-beige-50 to-beige-100">
        <div className="z-10 max-w-4xl w-full items-center justify-center">
          {/* Logo */}
          <div className="text-center mb-12">
            <h1 className="text-6xl sm:text-7xl font-serif font-bold text-primary-500 mb-4 leading-tight">
              amiga<br />fertility
            </h1>
            <div className="w-24 h-1 bg-purple-500 mx-auto mb-8"></div>
          </div>

          {/* Tagline */}
          <p className="text-center text-xl sm:text-2xl text-gray-800 mb-4 font-serif">
            Your trusted companion in the fertility journey
          </p>
          <p className="text-center text-base sm:text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
            Guiding you with empathy, respect, and personalized support to find the best fertility clinics for your unique path.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <a
              href="/auth/login"
              className="px-8 py-4 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all duration-200 shadow-lg font-serif font-bold text-lg text-center"
            >
              Patient Login
            </a>
            <a
              href="/auth/login?screen_hint=signup"
              className="px-8 py-4 bg-white text-primary-600 border-2 border-primary-500 rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-md font-serif font-bold text-lg text-center"
            >
              New Patient Registration
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
