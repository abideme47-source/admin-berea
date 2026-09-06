'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Quote = { id: string; book_id: number; quote: string; book_title?: string; book_author?: string }

function QuoteModal({ quote, bookTitle, onClose, onSave }: { quote: Quote | null; bookTitle: string; onClose: () => void; onSave: () => void }) {
  const [text, setText] = useState(quote?.quote || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    
    if (!text.trim()) {
      setMessage('Quote cannot be empty')
      setIsError(true)
      setSaving(false)
      return
    }

    if (quote) {
      const { error } = await supabase.from('quotes').update({ quote: text.trim() }).eq('id', quote.id)
      if (error) {
        setMessage('Error updating: ' + error.message)
        setIsError(true)
      } else {
        setMessage('Quote updated!')
        setIsError(false)
        onSave()
        setTimeout(onClose, 600)
      }
    } else {
      const { error } = await supabase.from('quotes').insert({ quote: text.trim() })
      if (error) {
        setMessage('Error adding: ' + error.message)
        setIsError(true)
      } else {
        setMessage('Quote added!')
        setIsError(false)
        onSave()
        setTimeout(onClose, 600)
      }
    }
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
          {quote ? 'Edit Quote' : 'Add Quote'}
        </h2>
        
        {message && (
          <p style={{ margin: '0 0 12px', padding: 10, borderRadius: 8, background: isError ? '#fee2e2' : '#dcfce7', color: isError ? '#dc2626' : '#16a34a', fontSize: 13, fontWeight: 600 }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Book</label>
            <input className="input" value={bookTitle} disabled style={{ background: 'var(--soft)', opacity: 0.8 }} />
          </div>
          <div className="form-group">
            <label className="label">Quote *</label>
            <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} required style={{ minHeight: 80, resize: 'vertical' }} placeholder="Enter the quote..." />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving...' : quote ? 'Update' : 'Add Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuoteModal
