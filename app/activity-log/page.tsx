'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import { AdminContext } from '@/components/AdminGuard'

type Activity = { id: string; admin_id: string; action: string; details: string; created_at: string; admin_email?: string }
type Comment = { id: number; book_id: number; author_name: string; content: string; created_at: string; book_title?: string }

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activityFilter, setActivityFilter] = useState('')
  const [commentFilter, setCommentFilter] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [activitiesRes, booksData, commentsData] = await Promise.all([
        fetch('/api/activity-log').then(res => res.ok ? res.json() : { activities: [] }),
        supabase.from('books').select('id, title'),
        supabase.from('book_comments').select('*').order('created_at', { ascending: false }),
      ])
      setActivities(activitiesRes.activities || [])
      setBooks(booksData.data || [])
      const enriched = (commentsData.data || []).map((c: any) => ({
        ...c,
        book_title: (booksData.data || []).find((b: any) => b.id === c.book_id)?.title || 'Unknown',
      }))
      setComments(enriched)
      setLoading(false)
    }
    load()
  }, [])

  const filteredActivities = activities.filter((a) =>
    a.action.toLowerCase().includes(activityFilter.toLowerCase()) ||
    a.details?.toLowerCase().includes(activityFilter.toLowerCase()) ||
    a.admin_email?.toLowerCase().includes(activityFilter.toLowerCase())
  )

  const filteredComments = comments.filter((c) =>
    c.content.toLowerCase().includes(commentFilter.toLowerCase()) ||
    c.author_name.toLowerCase().includes(commentFilter.toLowerCase()) ||
    (c.book_title || '').toLowerCase().includes(commentFilter.toLowerCase())
  )

  function handleDeleteComment(id: number) {
    if (!confirm('Delete this comment?')) return
    supabase.from('book_comments').delete().eq('id', id).then(() => {
      setComments((prev) => prev.filter((c) => c.id !== id))
      import('@/lib/activity').then(({ logActivity }) => logActivity('delete_comment', `Deleted comment #${id}`))
    })
  }

  function exportCommentsCSV() {
    const headers = ['Author', 'Book', 'Comment', 'Date']
    const rows = filteredComments.map((c) => [c.author_name, c.book_title || '', c.content, new Date(c.created_at).toLocaleString()])
    const csv = [headers, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'comments.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AdminGuard>
      <AdminContext.Consumer>
        {(admin) => (
          <div className="admin-page">
            <AdminHeader title="Activity & Comments" />
            <main className="admin-content">
              {!admin?.permissions?.view_dashboard && !admin?.permissions?.manage_comments ? (
                <div className="empty-state">
                  <p>You don't have permission to view this page.</p>
                </div>
              ) : (
                <>
                  {admin?.permissions?.view_dashboard && (
                    <>
                      <div className="form-group">
                        <input
                          className="input"
                          placeholder="Search activity..."
                          value={activityFilter}
                          onChange={(e) => setActivityFilter(e.target.value)}
                        />
                      </div>
                      {loading ? (
                        <div className="empty-state">Loading...</div>
                      ) : filteredActivities.length === 0 ? (
                        <div className="empty-state">
                          <p>No activity yet</p>
                        </div>
                      ) : (
                        <div className="section-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
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
                                {filteredActivities.map((a) => (
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

                  {admin?.permissions?.manage_comments && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div className="form-group" style={{ flex: 1, marginRight: 10, marginBottom: 0 }}>
                          <input
                            className="input"
                            placeholder="Search comments..."
                            value={commentFilter}
                            onChange={(e) => setCommentFilter(e.target.value)}
                          />
                        </div>
                        <button className="btn btn-secondary" onClick={exportCommentsCSV}>Export CSV</button>
                      </div>

                      {loading ? (
                        <div className="empty-state">Loading...</div>
                      ) : filteredComments.length === 0 ? (
                        <div className="empty-state">
                          <p>No comments found</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {filteredComments.map((comment) => (
                            <div key={comment.id} className="section-card" style={{ marginBottom: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14 }}>{comment.author_name}</p>
                                  <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--muted)' }}>on: {comment.book_title}</p>
                                  <p style={{ margin: 0, fontSize: 13, color: 'var(--foreground)', lineHeight: 1.5 }}>{comment.content}</p>
                                  <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                                    {new Date(comment.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteComment(comment.id)}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
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
