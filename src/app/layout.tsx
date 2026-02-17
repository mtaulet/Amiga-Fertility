import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import UserProvider from '@/components/auth/UserProvider'
import { Provider } from '@/components/ui/provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
      <body className={`${inter.variable}`}>
        <Provider>
          <UserProvider>{children}</UserProvider>
        </Provider>
      </body>
    </html>
  )
}
