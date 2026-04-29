import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { ReactNode } from 'react'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const adminOk = await isAdmin()
  if (!adminOk) redirect('/dashboard')
  return <>{children}</>
}
