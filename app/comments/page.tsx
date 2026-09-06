'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import { AdminContext } from '@/components/AdminGuard'

type Comment = { id: number; book_id: number; author_name: string; content: string; created_at: string; book_title?: string }

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function loadData() {
    setLoading(true)
    const [{ data: booksData }, { data: commentsData }] = await Promise.all([
      supabase.from('books').select('id, title'),
      supabase.from('book_comments').select('*').order('created_at', { ascending: false }),
    ])
    setBooks(booksData || [])
    const enriched = (commentsData || []).map((c: any) => ({
      ...c,
      book_title: (booksData || []).find((b: any) => b.id === c.book_id)?.title || 'Unknown',
    }))
    setComments(enriched)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function handleDelete(id: number) {
    if (!confirm('Delete this comment?')) return
    supabase.from('book_comments').delete().eq('id', id).then(() => {
      loadData()
      import('@/lib/activity').then(({ logActivity }) => logActivity('delete_comment', `Deleted comment #${id}`))
    })
  }

  const filtered = comments.filter((c) =>
    c.content.toLowerCase().includes(filter.toLowerCase()) ||
    c.author_name.toLowerCase().includes(filter.toLowerCase()) ||
    (c.book_title || '').toLowerCase().includes(filter.toLowerCase())
  )

  function exportCSV() {
    const headers = ['Author', 'Book', 'Comment', 'Date']
    const rows = filtered.map((c) => [c.author_name, c.book_title || '', c.content, new Date(c.created_at).toLocaleString()])
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
            <AdminHeader title="Comments" />
            <main className="admin-content">
              {!admin?.permissions?.manage_comments ? (
                <div className="empty-state">
                  <p>You don't have permission to manage comments.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div className="form-group" style={{ flex: 1, marginRight: 10, marginBottom: 0 }}>
                      <input
                        className="input"
                        placeholder="Search comments..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-secondary" onClick={exportCSV}>Export CSV</button>
                  </div>

                  {loading ? (
                    <div className="empty-state">Loading...</div>
                  ) : filtered.length === 0 ? (
                    <div className="empty-state">
                      <p>No comments found</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {filtered.map((comment) => (
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
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(comment.id)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
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
