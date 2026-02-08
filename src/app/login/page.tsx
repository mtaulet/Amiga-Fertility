'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-beige-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto"></div>
          <p className="mt-6 text-gray-700 font-serif text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-beige-50 to-beige-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-5xl font-serif font-bold text-primary-500 mb-4 leading-tight">
            amiga<br />fertility
          </h1>
          <div className="w-24 h-1 bg-purple-500 mx-auto mb-6"></div>
        </div>

        <div className="bg-white shadow-xl rounded-2xl border border-beige-200 px-8 py-10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-center text-gray-900">
              Patient Portal
            </h2>
            <p className="mt-3 text-center text-base text-gray-700">
              Secure access to your fertility journey
            </p>
          </div>
          <div className="mt-8 space-y-4">
            <a
              href="/auth/login"
              className="group relative flex w-full justify-center rounded-xl border border-transparent bg-primary-500 py-4 px-6 text-base font-serif font-bold text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-md"
            >
              Sign in to your account
            </a>
            <a
              href="/auth/login?screen_hint=signup"
              className="group relative flex w-full justify-center rounded-xl border-2 border-primary-500 bg-white py-4 px-6 text-base font-serif font-bold text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all"
            >
              Create new account
            </a>
          </div>
          <div className="mt-8 text-xs text-center text-gray-600 border-t border-beige-200 pt-6">
            <p>
              Your data is protected with enterprise-grade security and HIPAA-compliant infrastructure
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
