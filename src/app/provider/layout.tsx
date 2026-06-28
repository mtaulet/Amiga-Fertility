import { redirect } from 'next/navigation'
import { isProvider } from '@/lib/admin'
import { ReactNode } from 'react'

export default async function ProviderLayout({ children }: { children: ReactNode }) {
  const ok = await isProvider()
  if (!ok) redirect('/dashboard')
  return <>{children}</>
}
