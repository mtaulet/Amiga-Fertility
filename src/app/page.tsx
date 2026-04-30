'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [mode, setMode] = useState<'patient' | 'admin'>('patient')

  useEffect(() => {
    if (!isLoading && user) router.push('/dashboard')
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F4EDE3' }}>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading…</p>
      </div>
    )
  }

  const isAdmin = mode === 'admin'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      minHeight: '100vh', paddingTop: '8vh', paddingBottom: '48px', padding: '8vh 16px 48px',
      background: 'linear-gradient(to bottom, #F4EDE3, #EDE3D3)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '52px', fontWeight: 700, lineHeight: 1.1,
            color: '#D55A35', fontFamily: 'Georgia, serif', marginBottom: '16px',
          }}>
            amiga<br />fertility
          </h1>
          <div style={{ width: '80px', height: '3px', background: '#6B4D78', margin: '0 auto' }} />
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'flex', background: '#EDE3D3', borderRadius: '99px',
            padding: '4px', gap: '2px',
          }}>
            {(['patient', 'admin'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '8px 24px', borderRadius: '99px', fontSize: '14px',
                fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? (m === 'admin' ? '#6B4D78' : '#D55A35') : '#9ca3af',
                boxShadow: mode === m ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
              }}>
                {m === 'patient' ? 'Patient' : 'Admin'}
              </button>
            ))}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '40px 32px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
          border: `2px solid ${isAdmin ? '#E5DCE9' : '#FAF7F3'}`,
          transition: 'border-color 0.2s',
          minHeight: '320px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            {isAdmin && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#F5F1F7', color: '#6B4D78', borderRadius: '99px',
                padding: '5px 14px', fontSize: '11px', fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '14px',
              }}>
                🔒 Admin Portal
              </div>
            )}
            <h2 style={{
              fontSize: '24px', fontWeight: 700, color: '#1a1a1a',
              marginBottom: '8px', fontFamily: 'Georgia, serif',
            }}>
              {isAdmin ? 'Admin Sign In' : 'Patient Portal'}
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>
              {isAdmin
                ? 'Access the Amiga Fertility admin dashboard'
                : 'Secure access to your fertility journey'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href={isAdmin ? '/auth/login?returnTo=/admin/dashboard' : '/auth/login'}
              style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                width: '100%', padding: '15px 24px', borderRadius: '12px',
                fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                background: isAdmin ? '#6B4D78' : '#E67449', color: 'white',
                boxSizing: 'border-box',
              }}
            >
              {isAdmin ? 'Sign in as Admin' : 'Sign in to your account'}
            </a>

            {!isAdmin && (
              <a
                href="/auth/login?screen_hint=signup"
                style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  width: '100%', padding: '15px 24px', borderRadius: '12px',
                  fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                  background: 'white', color: '#D55A35',
                  border: '2px solid #E67449', boxSizing: 'border-box',
                }}
              >
                Create new account
              </a>
            )}
          </div>

          <div style={{
            marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6',
            fontSize: '12px', color: '#9ca3af', textAlign: 'center', lineHeight: 1.5,
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
