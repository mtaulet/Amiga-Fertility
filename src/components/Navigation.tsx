'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navigation() {
  const { user, isLoading } = useUser()
  const [mounted, setMounted] = useState(false)

  // Only render auth-dependent content after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="bg-white shadow-sm border-b border-beige-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-serif font-bold text-primary-500 leading-tight">
                amiga<br className="sm:hidden" />
                <span className="hidden sm:inline"> </span>fertility
              </span>
            </Link>
            {mounted && user && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-base font-medium text-gray-900 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/appointments/start"
                  className="inline-flex items-center px-1 pt-1 text-base font-medium text-gray-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors"
                >
                  Start Appointment
                </Link>
                <Link
                  href="/clinics"
                  className="inline-flex items-center px-1 pt-1 text-base font-medium text-gray-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors"
                >
                  Find Clinics
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center px-1 pt-1 text-base font-medium text-gray-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors"
                >
                  Profile
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {mounted && !isLoading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user.name || user.email}
                    </span>
                    <a
                      href="/auth/logout"
                      className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-serif font-bold rounded-lg text-white bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm"
                    >
                      Sign out
                    </a>
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-serif font-bold rounded-lg text-white bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm"
                  >
                    Sign in
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
