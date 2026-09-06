'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import { AdminContext } from '@/components/AdminGuard'

type AppUser = { id: string; email: string; name?: string; role?: string; created_at: string; last_sign_in_at?: string }

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function loadUsers() {
      setLoading(true)
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
      setLoading(false)
    }
    loadUsers()
  }, [])

  const filtered = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()) || (u.name || '').toLowerCase().includes(search.toLowerCase()))

  function exportCSV() {
    const headers = ['Name', 'Email', 'Joined', 'Last Sign In']
    const rows = filtered.map((u) => [u.name || '', u.email, new Date(u.created_at).toLocaleDateString(), u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'])
    const csv = [headers, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function resetPassword(userId: string, userEmail: string) {
    if (!confirm(`Send password reset email to ${userEmail}?`)) return
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    })
    if (res.ok) {
      alert('Password reset email sent successfully!')
    } else {
      const data = await res.json()
      alert('Error: ' + data.error)
    }
  }

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div className="form-group" style={{ flex: 1, marginRight: 10, marginBottom: 0 }}>
                      <input
                        className="input"
                        placeholder="Search by email or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-secondary" onClick={exportCSV}>Export CSV</button>
                  </div>

                  {loading ? (
                    <div className="empty-state">Loading...</div>
                  ) : filtered.length === 0 ? (
                    <div className="empty-state">
                      <p>No users found</p>
                    </div>
                  ) : (
                    <div className="section-card" style={{ padding: 0, overflowX: 'auto' }}>
                      <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Last Sign In</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((user) => (
                            <tr key={user.id}>
                              <td style={{ fontWeight: 600 }}>{user.name || '—'}</td>
                              <td style={{ color: 'var(--muted)', fontSize: 12 }}>{user.email}</td>
                              <td>
                                {user.role === 'owner' && <span className="badge badge-primary">Owner</span>}
                                {user.role === 'manager' && <span className="badge badge-success">Manager</span>}
                                {user.role === 'staff' && <span className="badge badge-warning">Staff</span>}
                                {user.role === 'member' && <span className="badge" style={{ background: 'var(--soft)', color: 'var(--muted)' }}>Member</span>}
                              </td>
                              <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                              </td>
                              <td>
                                <button className="btn btn-sm btn-secondary" onClick={() => resetPassword(user.id, user.email)}>
                                  Reset Password
                                </button>
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
