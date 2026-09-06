'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import { AdminContext } from '@/components/AdminGuard'

type AdminRecord = { id: string; user_id: string; role: string; permissions: Record<string, boolean>; created_at: string; email?: string }

const ALL_PERMISSIONS = [
  { key: 'manage_books', label: 'Manage Books' },
  { key: 'manage_comments', label: 'Manage Comments' },
  { key: 'manage_users', label: 'Manage Users' },
  { key: 'manage_admins', label: 'Manage Admins' },
  { key: 'manage_settings', label: 'Manage Settings' },
  { key: 'view_dashboard', label: 'View Dashboard' },
  { key: 'change_profile_info', label: 'Change Profile Info' },
]

const ROLES = ['owner', 'manager', 'staff'] as const

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminRecord[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRole, setSelectedRole] = useState('staff')
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({
    manage_books: true,
    manage_comments: true,
    manage_users: true,
    manage_admins: true,
    manage_settings: true,
    view_dashboard: true,
    change_profile_info: true,
  })
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState('')
  const supabase = createClient()

  async function loadData() {
    setLoading(true)
    setError('')
    setApiError('')
    try {
      const [adminsRes, usersRes] = await Promise.all([
        fetch('/api/admins', { cache: 'no-store' }),
        fetch('/api/users', { cache: 'no-store' }),
      ])
      const [adminsData, usersData] = await Promise.all([
        adminsRes.json(),
        usersRes.json(),
      ])
      if (!adminsRes.ok) {
        throw new Error(adminsData.error || 'Failed to load admins')
      }
      if (!usersRes.ok) {
        throw new Error(usersData.error || 'Failed to load users')
      }
      const adminsWithEmail = (adminsData.admins || []).map((a: AdminRecord) => ({
        ...a,
        email: a.email || 'Unknown',
      }))
      adminsWithEmail.sort((a: AdminRecord, b: AdminRecord) => {
        if (a.role === 'owner' && b.role !== 'owner') return -1
        if (b.role === 'owner' && a.role !== 'owner') return 1
        return 0
      })
      setAdmins(adminsWithEmail)
      setUsers((usersData.users || []).filter((u: any) => u.email))
    } catch (e: any) {
      console.error('Failed to load admins/users:', e)
      setApiError(e.message || 'Failed to load data')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleAdd() {
    setError('')
    if (!selectedUser) {
      setError('Please select a user')
      return
    }
    const { error } = await supabase.from('admins').insert({
      user_id: selectedUser,
      role: selectedRole,
      permissions: selectedPermissions,
    })
    if (error) {
      setError(error.message)
    } else {
      setShowAdd(false)
      setSelectedUser('')
      loadData()
      import('@/lib/activity').then(({ logActivity }) => logActivity('add_admin', `Added admin: ${users.find((u: any) => u.id === selectedUser)?.email}`))
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this admin?')) return
    const admin = admins.find((a) => a.id === id)
    await supabase.from('admins').delete().eq('id', id)
    loadData()
    if (admin) import('@/lib/activity').then(({ logActivity }) => logActivity('remove_admin', `Removed admin: ${admin.email}`))
  }

  async function handleUpdateRole(id: string, role: string) {
    const admin = admins.find((a) => a.id === id)
    await supabase.from('admins').update({ role }).eq('id', id)
    loadData()
    if (admin) import('@/lib/activity').then(({ logActivity }) => logActivity('update_admin_role', `Changed ${admin.email} role to ${role}`))
  }

  async function handleUpdatePermission(id: string, key: string, value: boolean) {
    const admin = admins.find((a) => a.id === id)
    if (!admin) return
    const newPerms = { ...admin.permissions, [key]: value }
    await supabase.from('admins').update({ permissions: newPerms }).eq('id', id)
    loadData()
    import('@/lib/activity').then(({ logActivity }) => logActivity('update_admin_permission', `${admin.email}: ${key} = ${value}`))
  }

  return (
    <AdminGuard>
      <AdminContext.Consumer>
        {(currentAdmin) => (
          <div className="admin-page">
            <AdminHeader title="Admins" />
            <main className="admin-content">
              {!currentAdmin?.permissions?.manage_admins ? (
                <div className="empty-state">
                  <p>You don't have permission to manage admins.</p>
                </div>
              ) : (
                <>
                  {apiError && (
                    <div style={{ padding: 10, borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                      {apiError}
                    </div>
                  )}
                  {!showAdd ? (
                    <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
                      + Add Admin
                    </button>
                  ) : (
                    <div className="section-card">
                      <h2 className="section-title">Add Admin</h2>
                      {error && <p className="auth-error">{error}</p>}
                      <div className="form-group">
                        <label className="label">User</label>
                        <select className="input" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                          <option value="">Select a user</option>
                          {users
                            .filter((u) => !admins.some((a) => a.user_id === u.id))
                            .map((u) => (
                              <option key={u.id} value={u.id}>{u.email}</option>
                            ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="label">Role</label>
                        <select className="input" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="label">Permissions</label>
                        {ALL_PERMISSIONS.map((perm) => (
                          <div key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                            <input
                              type="checkbox"
                              className="toggle"
                              checked={selectedPermissions[perm.key] || false}
                              onChange={(e) => setSelectedPermissions({ ...selectedPermissions, [perm.key]: e.target.checked })}
                            />
                            <span style={{ fontSize: 14 }}>{perm.label}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleAdd} style={{ flex: 1 }}>Add</button>
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="empty-state">Loading...</div>
                  ) : (
                    <div className="section-card" style={{ padding: 0 }}>
                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Permissions</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {admins.map((admin) => (
                              <tr key={admin.id}>
                                <td style={{ fontWeight: 600 }}>{admin.email}</td>
                                <td>
                                  {admin.id === currentAdmin.id ? (
                                    <span className="badge badge-primary">{admin.role}</span>
                                  ) : (
                                    <select
                                      className="input"
                                      value={admin.role}
                                      onChange={(e) => handleUpdateRole(admin.id, e.target.value)}
                                      style={{ padding: '6px 10px', fontSize: 12, minHeight: 32, width: 'auto' }}
                                    >
                                      {ROLES.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                      ))}
                                    </select>
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {ALL_PERMISSIONS.map((perm) => (
                                      <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                                        <input
                                          type="checkbox"
                                          checked={admin.permissions[perm.key] || false}
                                          onChange={(e) => handleUpdatePermission(admin.id, perm.key, e.target.checked)}
                                          disabled={admin.id === currentAdmin.id && perm.key === 'manage_admins'}
                                        />
                                        {perm.label}
                                      </label>
                                    ))}
                                  </div>
                                </td>
                                <td>
                                  {admin.id !== currentAdmin.id && (
                                    <button className="btn btn-sm btn-danger" onClick={() => handleRemove(admin.id)}>Remove</button>
                                  )}
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
