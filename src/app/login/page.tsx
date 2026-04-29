'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [mode, setMode] = useState<'patient' | 'admin'>('patient')

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

  const isAdmin = mode === 'admin'

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

        {/* Mode toggle */}
        <div className="flex items-center justify-center mb-2">
          <div
            style={{
              display: 'flex',
              background: '#EDE3D3',
              borderRadius: '99px',
              padding: '4px',
              gap: '2px',
            }}
          >
            {(['patient', 'admin'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '7px 22px',
                  borderRadius: '99px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? (m === 'admin' ? '#6B4D78' : '#D55A35') : '#9ca3af',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  letterSpacing: '0.01em',
                }}
              >
                {m === 'patient' ? 'Patient' : 'Admin'}
              </button>
            ))}
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            border: `2px solid ${isAdmin ? '#E5DCE9' : '#FAF7F3'}`,
            padding: '40px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            transition: 'border-color 0.2s',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            {isAdmin && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#F5F1F7',
                color: '#6B4D78',
                borderRadius: '99px',
                padding: '4px 14px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}>
                <span>🔒</span> Admin Portal
              </div>
            )}
            <h2 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: '6px',
              fontFamily: 'serif',
            }}>
              {isAdmin ? 'Admin Sign In' : 'Patient Portal'}
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              {isAdmin
                ? 'Access the Amiga Fertility admin dashboard'
                : 'Secure access to your fertility journey'}
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href={isAdmin ? '/auth/login?returnTo=/admin/dashboard' : '/auth/login'}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                padding: '14px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                transition: 'all 0.15s',
                background: isAdmin ? '#6B4D78' : '#E67449',
                color: 'white',
                border: 'none',
              }}
            >
              {isAdmin ? 'Sign in as Admin' : 'Sign in to your account'}
            </a>

            {!isAdmin && (
              <a
                href="/auth/login?screen_hint=signup"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '15px',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  background: 'white',
                  color: '#D55A35',
                  border: '2px solid #E67449',
                }}
              >
                Create new account
              </a>
            )}
          </div>

          {/* Footer note */}
          <div style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #f3f4f6',
            fontSize: '12px',
            color: '#9ca3af',
            textAlign: 'center',
          }}>
            {isAdmin
              ? 'Admin access is restricted. Contact your system administrator if you need access.'
              : 'Your data is protected with enterprise-grade security and HIPAA-compliant infrastructure'}
          </div>
        </div>

      </div>
    </div>
  )
}
