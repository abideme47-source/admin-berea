'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import { AdminContext } from '@/components/AdminGuard'

type Book = { id: number; title: string; author: string; status: string; cover: string; created_at?: string; year?: string; language?: string; translator?: string; quote?: string; description?: string; is_new_arrival?: boolean }
type Comment = { id: number; book_id: number; author_name: string; content: string; created_at: string; book_title?: string }
type Like = { book_title: string; count: number }
type Setting = { key: string; value: string }

function TrendingBook({ title, count, label }: { title: string; count: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
        {label === 'Likes' ? '❤' : label === 'Comments' ? '💬' : '📦'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{count} {label.toLowerCase()}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [likes, setLikes] = useState<Like[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [recentComments, setRecentComments] = useState<Comment[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentBooks, setRecentBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function loadData() {
    setLoading(true)
    const [{ data: booksData }, { data: commentsData }, { data: likesData }, { data: usersData }, { data: settingsData }] = await Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('book_comments').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('likes').select('book_title').then(({ data }: { data: { book_title: string }[] | null }) => {
        const map = new Map<string, number>()
        ;(data || []).forEach((l: any) => { map.set(l.book_title, (map.get(l.book_title) || 0) + 1) })
        return { data: Array.from(map.entries()).map(([book_title, count]) => ({ book_title, count })) }
      }),
      supabase.auth.admin.listUsers(),
      supabase.from('site_settings').select('*'),
    ])

    setBooks(booksData || [])
    setComments(commentsData || [])
    setLikes(likesData || [])
    setRecentComments((commentsData || []).slice(0, 5))
    setRecentUsers((usersData?.users || []).slice(0, 5))
    setRecentBooks((booksData || []).slice(0, 5))
    const settingsMap: Record<string, string> = {}
    ;(settingsData || []).forEach((s: Setting) => { settingsMap[s.key] = s.value || '' })
    setSettings(settingsMap)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const topLiked = [...likes].sort((a, b) => b.count - a.count).slice(0, 5)
  const topCommented = (() => {
    const map = new Map<string, number>()
    comments.forEach((c) => { map.set(c.book_title || 'Unknown', (map.get(c.book_title || 'Unknown') || 0) + 1) })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([book_title, count]) => ({ book_title, count }))
  })()

  return (
    <AdminGuard>
      <div className="admin-page">
        <AdminHeader title="Dashboard" />
        <main className="admin-content">
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : (
            <>
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                  <div className="stat-value">{books.length}</div>
                  <div className="stat-label">Books</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{comments.length}</div>
                  <div className="stat-label">Comments</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{likes.reduce((a, l) => a + l.count, 0)}</div>
                  <div className="stat-label">Likes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{users.length}</div>
                  <div className="stat-label">Users</div>
                </div>
              </div>

              <div className="section-card">
                <h2 className="section-title">Trending</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Liked</p>
                    {topLiked.length === 0 ? <p style={{ fontSize: 13, color: 'var(--muted)' }}>No likes yet</p> : topLiked.map((l, i) => <TrendingBook key={i} title={l.book_title} count={l.count} label="Likes" />)}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Commented</p>
                    {topCommented.length === 0 ? <p style={{ fontSize: 13, color: 'var(--muted)' }}>No comments yet</p> : topCommented.map((l, i) => <TrendingBook key={i} title={l.book_title} count={l.count} label="Comments" />)}
                  </div>
                </div>
              </div>

              <div className="section-card">
                <h2 className="section-title">Recent Comments</h2>
                {recentComments.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>No comments yet</p>
                ) : (
                  recentComments.map((c) => (
                    <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 13 }}>{c.author_name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="section-card">
                <h2 className="section-title">Recent Users</h2>
                {recentUsers.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>No users yet</p>
                ) : (
                  recentUsers.map((u) => (
                    <div key={u.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{u.email}</span>
                      <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: 11 }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="section-card">
                <h2 className="section-title">Recent Books Added</h2>
                {recentBooks.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>No books yet</p>
                ) : (
                  recentBooks.map((book) => (
                    <div key={book.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{book.title}</span>
                      <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: 11 }}>
                        {book.created_at ? new Date(book.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="section-card">
                <h2 className="section-title">Active Book Quotes</h2>
                {(() => {
                  const quoted = books.filter((b) => b.quote && b.quote.trim().length > 0)
                  if (quoted.length === 0) return <p style={{ fontSize: 13, color: 'var(--muted)' }}>No quotes added yet</p>
                  return quoted.map((b) => (
                    <div key={b.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 13, fontStyle: 'italic', color: 'var(--foreground)' }}>"{b.quote}"</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{b.title} · {b.author}{b.translator ? ' · transl. ' + b.translator : ''}</p>
                    </div>
                  ))
                })()}
              </div>
            </>
          )}
        </main>
        <BottomNav />
      </div>
    </AdminGuard>
  )
}
