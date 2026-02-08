import type { Metadata } from 'next'
import { Inter, Libre_Baskerville } from 'next/font/google'
import './globals.css'
import UserProvider from '@/components/auth/UserProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const libreBaskerville = Libre_Baskerville({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-libre-baskerville',
})

export const metadata: Metadata = {
  title: 'Amiga Fertility - Patient Portal',
  description: 'Secure patient portal for fertility clinic guidance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${libreBaskerville.variable} font-serif`}>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  )
}
