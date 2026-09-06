'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import { AdminContext } from '@/components/AdminGuard'

type Activity = { id: string; admin_id: string; action: string; details: string; created_at: string; admin_email?: string }

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch('/api/activity-log')
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = activities.filter((a) =>
    a.action.toLowerCase().includes(filter.toLowerCase()) ||
    a.details?.toLowerCase().includes(filter.toLowerCase()) ||
    a.admin_email?.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <AdminGuard>
      <AdminContext.Consumer>
        {(admin) => (
          <div className="admin-page">
            <AdminHeader title="Activity Log" />
            <main className="admin-content">
              {!admin?.permissions?.view_dashboard ? (
                <div className="empty-state">
                  <p>You don't have permission to view activity log.</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <input
                      className="input"
                      placeholder="Search activity..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                  {loading ? (
                    <div className="empty-state">Loading...</div>
                  ) : filtered.length === 0 ? (
                    <div className="empty-state">
                      <p>No activity yet</p>
                    </div>
                  ) : (
                    <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Admin</th>
                              <th>Action</th>
                              <th>Details</th>
                              <th>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((a) => (
                              <tr key={a.id}>
                                <td style={{ fontWeight: 600, fontSize: 12 }}>{a.admin_email}</td>
                                <td><span className="badge badge-primary">{a.action}</span></td>
                                <td style={{ fontSize: 12, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.details || '—'}</td>
                                <td style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(a.created_at).toLocaleString()}</td>
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
