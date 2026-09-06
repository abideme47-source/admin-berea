'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminHeader({ title }: { title: string }) {
  const router = useRouter()

  async function handleLogout() {
    const client = createClient()
    await client.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="admin-header">
      <h1>{title}</h1>
      <button className="btn btn-sm btn-secondary" onClick={handleLogout} style={{ minHeight: 36, padding: '8px 12px' }}>
        Logout
      </button>
    </header>
  )
}
