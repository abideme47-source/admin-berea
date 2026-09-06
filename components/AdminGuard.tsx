'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AdminUser = {
  id: string
  email: string
  role: string
  permissions: Record<string, boolean>
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = createClient()
    client.auth.getUser().then(async ({ data }: { data: { user: { id: string; email?: string } | null } }) => {
      if (!data.user) {
        router.push('/login')
        return
      }
      const { data: adminRecord } = await client
        .from('admins')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (!adminRecord) {
        router.push('/login')
        return
      }

      setAdmin({
        id: adminRecord.id,
        email: data.user.email || '',
        role: adminRecord.role,
        permissions: adminRecord.permissions || {},
      })
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="admin-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--line)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!admin) return null

  return <AdminContext.Provider value={admin}>{children}</AdminContext.Provider>
}

export const AdminContext = React.createContext<AdminUser | null>(null)
import React from 'react'
