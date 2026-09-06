'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import { AdminContext } from '@/components/AdminGuard'
import { use } from 'react'

type Book = { id: number; title: string; author: string; status: string; cover: string; year: string; language: string; description: string; is_new_arrival: boolean; translator?: string; quote?: string; is_community_favorite?: boolean }
type Comment = { id: number; book_id: number; author_name: string; content: string; created_at: string }
type Like = { book_title: string; count: number }

function BookModal({ book, onClose, onSave }: { book: Book | null; onClose: () => void; onSave: () => void }) {
  const [title, setTitle] = useState(book?.title || '')
  const [author, setAuthor] = useState(book?.author || '')
  const [status, setStatus] = useState(book?.status || 'NEW')
  const [year, setYear] = useState(book?.year || '')
  const [language, setLanguage] = useState(book?.language || '')
  const [translator, setTranslator] = useState(book?.translator || '')
  const [description, setDescription] = useState(book?.description || '')
  const [quote, setQuote] = useState(book?.quote || '')
  const [isNewArrival, setIsNewArrival] = useState(book?.is_new_arrival || false)
  const [isCommunityFavorite, setIsCommunityFavorite] = useState(book?.is_community_favorite || false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState(book?.cover || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    if (!title.trim() || !author.trim() || !language.trim()) {
      setMessage('Title, Author, and Language are required.')
      setIsError(true)
      setSaving(false)
      return
    }

    let coverUrl = book?.cover || ''

    if (!book && !coverFile) {
      setMessage('Please upload a book cover image.')
      setIsError(true)
      setSaving(false)
      return
    }

    if (coverFile) {
      const ext = coverFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('book-covers').upload(fileName, coverFile, {
        upsert: true,
      })

      if (uploadError) {
        setMessage('Failed to upload image: ' + uploadError.message)
        setIsError(true)
        setSaving(false)
        return
      }

      const { data } = supabase.storage.from('book-covers').getPublicUrl(fileName)
      coverUrl = data.publicUrl
    }

    const bookData = {
      title,
      author,
      status,
      year,
      language,
      translator,
      description,
      quote,
      cover: coverUrl,
      is_new_arrival: isNewArrival,
      is_community_favorite: isCommunityFavorite,
    }

    if (book) {
      const { error } = await supabase.from('books').update(bookData).eq('id', book.id)
      if (error) {
        setMessage('Error updating: ' + error.message)
        setIsError(true)
      } else {
        setMessage('Book updated!')
        setIsError(false)
        onSave()
        setTimeout(onClose, 800)
      }
    } else {
      const { error } = await supabase.from('books').insert(bookData)
      if (error) {
        setMessage('Error adding: ' + error.message)
        setIsError(true)
      } else {
        setMessage('Book added!')
        setIsError(false)
        onSave()
        setTimeout(onClose, 800)
      }
    }

    setSaving(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setCoverFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setCoverPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
          {book ? 'Edit Book' : 'Add New Book'}
        </h2>

        {message && (
          <p style={{ margin: '0 0 12px', padding: 10, borderRadius: 8, background: isError ? '#fee2e2' : '#dcfce7', color: isError ? '#dc2626' : '#16a34a', fontSize: 13, fontWeight: 600 }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter book title" />
          </div>
          <div className="form-group">
            <label className="label">Author *</label>
            <input className="input" required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Original author name" />
          </div>
          <div className="form-group">
            <label className="label">Translator</label>
            <input className="input" value={translator} onChange={(e) => setTranslator(e.target.value)} placeholder="Translator name (if translated)" />
          </div>
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">None</option>
              <option value="NEW">New</option>
              <option value="LIMITED">Limited</option>
              <option value="FINISHED">Finished</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Year</label>
            <input className="input" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2024" />
          </div>
          <div className="form-group">
            <label className="label">Language *</label>
            <input className="input" required value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. Amharic, English" />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: 80, resize: 'vertical' }} placeholder="Brief description of the book" />
          </div>
          <div className="form-group">
            <label className="label">Quote from the book</label>
            <textarea className="input" rows={2} value={quote} onChange={(e) => setQuote(e.target.value)} style={{ minHeight: 60, resize: 'vertical' }} placeholder="A memorable quote from this book (will show in hero section)" />
          </div>
          <div className="form-group">
            <label className="label">Book Cover {!book ? '*' : ''}</label>
            <input type="file" accept="image/*" className="input" onChange={handleFileChange} required={!book} style={{ padding: 8 }} />
            {coverPreview && (
              <img src={coverPreview} alt="Preview" style={{ width: 80, height: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8, border: '1px solid var(--line)' }} />
            )}
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" className="toggle" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Show in New Arrivals</span>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" className="toggle" checked={isCommunityFavorite} onChange={(e) => setIsCommunityFavorite(e.target.checked)} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Show in Community Recommendations</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving...' : book ? 'Update' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [likes, setLikes] = useState<Like[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function loadData() {
    setLoading(true)
    const [{ data: booksData }, { data: commentsData }, { data: likesData }] = await Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('book_comments').select('*').order('created_at', { ascending: false }),
      supabase.from('likes').select('book_title').then(({ data }: { data: { book_title: string }[] | null }) => {
        // Aggregate likes by book title
        const map = new Map<string, number>()
        ;(data || []).forEach((l: any) => { map.set(l.book_title, (map.get(l.book_title) || 0) + 1) })
        return { data: Array.from(map.entries()).map(([book_title, count]) => ({ book_title, count })) }
      }),
    ])
    setBooks(booksData || [])
    setComments(commentsData || [])
    setLikes(likesData || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const filtered = books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()))

  function getCommentCount(bookId: number) {
    return comments.filter((c) => c.book_id === bookId).length
  }

  function getLikeCount(title: string) {
    return likes.find((l) => l.book_title === title)?.count || 0
  }

  const [recentlyDeleted, setRecentlyDeleted] = useState<Book[]>([])

  function handleDelete(book: Book) {
    if (!confirm(`Delete "${book.title}"?`)) return
    setRecentlyDeleted((prev) => [...prev, book])
    supabase.from('books').delete().eq('id', book.id).then(() => loadData())
  }

  function handleUndoDelete(book: Book) {
    setRecentlyDeleted((prev) => prev.filter((b) => b.id !== book.id))
    supabase.from('books').insert({
      title: book.title,
      author: book.author,
      status: book.status,
      cover: book.cover,
      year: book.year,
      language: book.language,
      description: book.description,
      is_new_arrival: book.is_new_arrival,
    }).then(() => loadData())
  }

  return (
    <AdminGuard>
      <AdminContext.Consumer>
        {(admin) => (
          <div className="admin-page">
            <AdminHeader title="Books" />
            <main className="admin-content">
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <input
                  className="input"
                  placeholder="Search books..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
                {admin?.permissions?.manage_books && (
                  <button className="btn btn-primary" onClick={() => { setEditingBook(null); setShowModal(true) }}>
                    + Add
                  </button>
                )}
              </div>

              {loading ? (
                <div className="empty-state">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <p>No books found</p>
                </div>
              ) : (
                <>
                  {recentlyDeleted.length > 0 && (
                    <div style={{ padding: '0 0 12px' }}>
                      {recentlyDeleted.map((book) => (
                        <div key={book.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                          <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Deleted: <strong>{book.title}</strong>
                          </span>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleUndoDelete(book)}>
                            Undo
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Cover</th>
                          <th>Title</th>
                          <th>Author</th>
                          <th>Status</th>
                          <th>New</th>
                          <th>Community</th>
                          <th>Likes</th>
                          <th>Comments</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((book) => (
                          <tr key={book.id}>
                            <td>
                              <img src={book.cover} alt="" style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 4, background: 'var(--soft)' }} />
                            </td>
                            <td style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</td>
                            <td style={{ color: 'var(--muted)' }}>{book.author}</td>
                            <td><span className={`badge ${book.status === 'NEW' ? 'badge-success' : book.status === 'LIMITED' ? 'badge-warning' : 'badge-primary'}`}>{book.status}</span></td>
                            <td>{book.is_new_arrival ? 'Yes' : 'No'}</td>
                            <td>{book.is_community_favorite ? 'Yes' : 'No'}</td>
                            <td>{getLikeCount(book.title)}</td>
                            <td>{getCommentCount(book.id)}</td>
                            <td style={{ display: 'flex', gap: 6 }}>
                              {admin?.permissions?.manage_books && (
                                <>
                                  <button className="btn btn-sm btn-secondary" onClick={() => { setEditingBook(book); setShowModal(true) }}>Edit</button>
                                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(book)}>Del</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                </>
              )}
            </main>

            {showModal && (
              <BookModal book={editingBook} onClose={() => setShowModal(false)} onSave={loadData} />
            )}

            <BottomNav />
          </div>
        )}
      </AdminContext.Consumer>
    </AdminGuard>
  )
}
