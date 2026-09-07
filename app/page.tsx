'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import QuoteModal from '@/components/QuoteModal'
import { AdminContext } from '@/components/AdminGuard'

type Book = { id: number; title: string; author: string; status: string; cover: string; created_at?: string; year?: string; language?: string; translator?: string; quote?: string; description?: string; is_new_arrival?: boolean; is_community_favorite?: boolean }
type Comment = { id: number; book_id: number; author_name: string; content: string; created_at: string; book_title?: string }
type Like = { book_title: string; count: number }
type Setting = { key: string; value: string }
type Quote = { id: string; book_id: number; quote: string; book_title?: string; book_author?: string }
type Announcement = { id: string; message: string; link_url?: string; is_active: boolean; created_at: string }

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
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [announcementMessage, setAnnouncementMessage] = useState('')
  const [announcementLink, setAnnouncementLink] = useState('')
  const [announcementActive, setAnnouncementActive] = useState(true)
  const [announcementSaved, setAnnouncementSaved] = useState('')
  const [totalBooks, setTotalBooks] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const supabase = createClient()

  async function loadData() {
    setLoading(true)
    const usersRes = await fetch('/api/users', { cache: 'no-store' })
    const usersJson = usersRes.ok ? await usersRes.json() : { users: [] }
    const [{ data: booksData }, { count: booksCount }, { data: commentsData }, { data: likesData }, { data: settingsData }, { count: ordersCount }, { data: quotesData }] = await Promise.all([
      supabase.from('books').select('*'),
      supabase.from('books').select('*', { count: 'exact', head: true }),
      supabase.from('book_comments').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('likes').select('book_title').then(({ data }: { data: { book_title: string }[] | null }) => {
        const map = new Map<string, number>()
        ;(data || []).forEach((l: any) => { map.set(l.book_title, (map.get(l.book_title) || 0) + 1) })
        return { data: Array.from(map.entries()).map(([book_title, count]) => ({ book_title, count })) }
      }),
      supabase.from('site_settings').select('*'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('quotes').select('*, book:book_id(id, title, author)'),
    ])

    setBooks(booksData || [])
    setTotalBooks(booksCount || 0)
    const commentsWithBook = (commentsData || []).map((c: any) => ({
      ...c,
      book_title: (booksData || []).find((b: any) => b.id === c.book_id)?.title || 'Unknown',
    }))
    setComments(commentsWithBook)
    setLikes(likesData || [])
    setRecentComments((commentsData || []).slice(0, 3))
    setUsers(usersJson.users || [])
    setRecentUsers((usersJson.users || []).slice(0, 3))
    setRecentBooks((booksData || []).slice(0, 3))
    setTotalOrders(ordersCount || 0)
    const enrichedQuotes = (quotesData || []).map((q: any) => ({
      ...q,
      book_title: q.book?.title || 'Unknown',
      book_author: q.book?.author || 'Unknown',
    }))
    setQuotes(enrichedQuotes)
    
    const announcementsRes = await fetch('/api/announcements')
    if (announcementsRes.ok) {
      const announcementsData = await announcementsRes.json()
      setAnnouncements(announcementsData.announcements || [])
      const activeAnnouncement = (announcementsData.announcements || []).find((a: Announcement) => a.is_active)
      if (activeAnnouncement) {
        setAnnouncementMessage(activeAnnouncement.message)
        setAnnouncementLink(activeAnnouncement.link_url || '')
        setAnnouncementActive(activeAnnouncement.is_active)
      }
    }
    
    const settingsMap: Record<string, string> = {}
    ;(settingsData || []).forEach((s: Setting) => { settingsMap[s.key] = s.value || '' })
    setSettings(settingsMap)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const topLiked = [...likes].sort((a, b) => b.count - a.count).slice(0, 3)
  const topCommented = (() => {
    const map = new Map<string, number>()
    comments.forEach((c) => { map.set(c.book_title || 'Unknown', (map.get(c.book_title || 'Unknown') || 0) + 1) })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([book_title, count]) => ({ book_title, count }))
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
                  <div className="stat-value">{totalBooks}</div>
                  <div className="stat-label">Books</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{users.length}</div>
                  <div className="stat-label">Members</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{totalOrders}</div>
                  <div className="stat-label">Orders</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{likes.reduce((a, l) => a + l.count, 0)}</div>
                  <div className="stat-label">Likes</div>
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
                <h2 className="section-title">Community Recommendations</h2>
                {(() => {
                  const communityBooks = books.filter((b) => b.is_community_favorite)
                  const availableBooks = books.filter((b) => !b.is_community_favorite)
                  if (books.length === 0) return <p style={{ fontSize: 13, color: 'var(--muted)' }}>No books yet</p>
                  return (
                    <div>
                      {communityBooks.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          {communityBooks.map((b) => (
                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span style={{ fontWeight: 600 }}>{b.title}</span>
                                <span style={{ color: 'var(--muted)', marginLeft: 6, fontSize: 11 }}>{b.author}</span>
                              </span>
                              <button className="btn btn-sm btn-danger" onClick={async () => { await supabase.from('books').update({ is_community_favorite: false }).eq('id', b.id); loadData(); import('@/lib/activity').then(({ logActivity }) => logActivity('remove_community', `Removed from community: ${b.title}`)) }}>Remove</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {availableBooks.length > 0 && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select id="add-community-book" className="input" defaultValue="" style={{ flex: 1, minHeight: 40 }}>
                            <option value="">Add a book...</option>
                            {availableBooks.map((b) => (
                              <option key={b.id} value={b.id}>{b.title} — {b.author}</option>
                            ))}
                          </select>
                          <button className="btn btn-sm btn-primary" onClick={async () => { const select = document.getElementById('add-community-book') as HTMLSelectElement | null; const id = select?.value; if (!id) return; const book = availableBooks.find(b => b.id === Number(id)); await supabase.from('books').update({ is_community_favorite: true }).eq('id', Number(id)); loadData(); if (select) select.value = ''; if (book) import('@/lib/activity').then(({ logActivity }) => logActivity('add_community', `Added to community: ${book.title}`)) }}>Add</button>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              <div className="section-card">
                <h2 className="section-title">Active Book Quotes</h2>
                {(() => {
                  if (quotes.length === 0) return <p style={{ fontSize: 13, color: 'var(--muted)' }}>No quotes added yet. Add quotes from the Books page.</p>
                  return (
                    <div>
                      {quotes.map((q) => (
                        <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 13, flexWrap: 'wrap' }}>
                          <span style={{ flex: 1, minWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 600 }}>{q.book_title}</span>
                            <span style={{ color: 'var(--muted)', marginLeft: 6, fontSize: 11 }}>"{q.quote}"</span>
                          </span>
                          <button className="btn btn-sm btn-secondary" onClick={() => { setEditingQuote(q); setShowQuoteModal(true) }}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={async () => { await supabase.from('quotes').delete().eq('id', q.id); loadData() }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              <div className="section-card">
                <h2 className="section-title">Announcement Banner</h2>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Create an announcement to show as a banner on the main site. Only one active announcement is shown at a time.</p>
                
                {(() => {
                  const activeAnnouncement = announcements.find((a) => a.is_active)
                  if (activeAnnouncement) {
                    return (
                      <div style={{ padding: 12, borderRadius: 8, background: '#dcfce7', border: '1px solid #bbf7d0', marginBottom: 16 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Active Announcement</p>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>{activeAnnouncement.message}</p>
                        {activeAnnouncement.link_url && <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--muted)' }}>{activeAnnouncement.link_url}</p>}
                        <button className="btn btn-sm btn-secondary" onClick={async () => {
                          await supabase.from('announcements').update({ is_active: false }).eq('id', activeAnnouncement.id)
                          setAnnouncementSaved('Announcement deactivated')
                          setTimeout(() => setAnnouncementSaved(''), 3000)
                          loadData()
                        }}>Deactivate</button>
                      </div>
                    )
                  }
                  return null
                })()}

                {announcementSaved && (
                  <div style={{ padding: 10, borderRadius: 8, background: announcementSaved.includes('deactivated') ? '#fee2e2' : '#dcfce7', color: announcementSaved.includes('deactivated') ? '#dc2626' : '#16a34a', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                    {announcementSaved}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <textarea
                    className="input"
                    rows={3}
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    placeholder="Announcement message..."
                    style={{ minHeight: 80, resize: 'vertical' }}
                  />
                  <input
                    className="input"
                    value={announcementLink}
                    onChange={(e) => setAnnouncementLink(e.target.value)}
                    placeholder="Link URL (optional)"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      id="announcement-active"
                      type="checkbox"
                      checked={announcementActive}
                      onChange={(e) => setAnnouncementActive(e.target.checked)}
                    />
                    <label htmlFor="announcement-active" style={{ fontSize: 13 }}>Active</label>
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={async () => {
                      if (!announcementMessage.trim()) return
                      const res = await fetch('/api/announcements', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: announcementMessage.trim(), link_url: announcementLink.trim() || null, is_active: announcementActive }),
                      })
                      if (res.ok) {
                        setAnnouncementSaved('Announcement published!')
                        setAnnouncementMessage('')
                        setAnnouncementLink('')
                        setAnnouncementActive(true)
                        setTimeout(() => setAnnouncementSaved(''), 3000)
                        loadData()
                      }
                    }}>Publish Announcement</button>
                  </div>
                </div>
                {announcements.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Recent Announcements</p>
                    {announcements.map((a) => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                        <span style={{ flex: 1, minWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600 }}>{a.message}</span>
                          {a.link_url && <span style={{ color: 'var(--muted)', marginLeft: 6, fontSize: 11 }}>{a.link_url}</span>}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                        {!a.is_active && (
                          <button className="btn btn-sm btn-primary" onClick={async () => {
                            await supabase.from('announcements').update({ is_active: true }).eq('id', a.id)
                            loadData()
                          }}>Activate</button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={async () => { await supabase.from('announcements').delete().eq('id', a.id); loadData() }}>Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
        {showQuoteModal && (
          <QuoteModal quote={editingQuote} bookTitle={editingQuote?.book_title || ''} onClose={() => { setShowQuoteModal(false); setEditingQuote(null) }} onSave={loadData} />
        )}
        <BottomNav />
      </div>
    </AdminGuard>
  )
}
