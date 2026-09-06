'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import { AdminContext } from '@/components/AdminGuard'

type AppUser = { id: string; email: string; name?: string; created_at: string; last_sign_in_at?: string }

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function loadUsers() {
      setLoading(true)
      const { data } = await supabase.auth.admin.listUsers()
      const list = (data?.users || []).map((u: any) => ({
        id: u.id,
        email: u.email || '',
        name: u.user_metadata?.name || '',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }))
      setUsers(list)
      setLoading(false)
    }
    loadUsers()
  }, [])

  const filtered = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()) || (u.name || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <AdminGuard>
      <AdminContext.Consumer>
        {(admin) => (
          <div className="admin-page">
            <AdminHeader title="Users" />
            <main className="admin-content">
              {!admin?.permissions?.manage_users ? (
                <div className="empty-state">
                  <p>You don't have permission to view users.</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <input
                      className="input"
                      placeholder="Search by email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {loading ? (
                    <div className="empty-state">Loading...</div>
                  ) : filtered.length === 0 ? (
                    <div className="empty-state">
                      <p>No users found</p>
                    </div>
                  ) : (
                    <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Joined</th>
                            <th>Last Sign In</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((user) => (
                            <tr key={user.id}>
                              <td style={{ fontWeight: 600 }}>{user.name || '—'}</td>
                              <td style={{ color: 'var(--muted)', fontSize: 12 }}>{user.email}</td>
                              <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </main>
            <BottomNav />
          </div>
        )}
      </AdminContext.Consumer>
    </AdminGuard>
  )
}
