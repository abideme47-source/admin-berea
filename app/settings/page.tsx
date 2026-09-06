'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import { AdminContext } from '@/components/AdminGuard'

type Setting = { key: string; value: string }

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  async function loadSettings() {
    setLoading(true)
    const { data } = await supabase.from('site_settings').select('*')
    const map: Record<string, string> = {}
    ;(data || []).forEach((s: Setting) => { map[s.key] = s.value || '' })
    setSettings(map)
    setLoading(false)
  }

  useEffect(() => { loadSettings() }, [])

  async function handleSave(key: string, value: string) {
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) {
      setMessage('Error saving: ' + error.message)
    } else {
      setMessage('Saved!')
      setSettings((prev) => ({ ...prev, [key]: value }))
      import('@/lib/activity').then(({ logActivity }) => logActivity('update_setting', `Updated setting: ${key}`))
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <AdminGuard>
      <AdminContext.Consumer>
        {(admin) => (
          <div className="admin-page">
            <AdminHeader title="Settings" />
            <main className="admin-content">
              {!admin?.permissions?.manage_settings ? (
                <div className="empty-state">
                  <p>You don't have permission to change settings.</p>
                </div>
              ) : (
                <>
                  {message && (
                    <div style={{ padding: 12, borderRadius: 10, background: message.includes('Error') ? '#fee2e2' : '#dcfce7', color: message.includes('Error') ? '#dc2626' : '#16a34a', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                      {message}
                    </div>
                  )}

                  <div className="section-card">
                    <h2 className="section-title">Contact & Social</h2>
                    <div className="form-group">
                      <label className="label">Order Telegram URL</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          className="input"
                          value={settings['telegram_order_url'] || ''}
                          onChange={(e) => setSettings((prev) => ({ ...prev, telegram_order_url: e.target.value }))}
                          placeholder="https://t.me/mariti776"
                          style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={() => handleSave('telegram_order_url', settings['telegram_order_url'] || '')} disabled={saving}>
                          Save
                        </button>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Full Telegram URL where order messages will be sent.</p>
                    </div>
                    <div className="form-group">
                      <label className="label">Telegram Channel URL</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          className="input"
                          value={settings['telegram_channel_url'] || ''}
                          onChange={(e) => setSettings((prev) => ({ ...prev, telegram_channel_url: e.target.value }))}
                          placeholder="https://t.me/bereabookstore"
                          style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={() => handleSave('telegram_channel_url', settings['telegram_channel_url'] || '')} disabled={saving}>
                          Save
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="label">Instagram URL</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          className="input"
                          value={settings['instagram_url'] || ''}
                          onChange={(e) => setSettings((prev) => ({ ...prev, instagram_url: e.target.value }))}
                          placeholder="https://www.instagram.com/..."
                          style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={() => handleSave('instagram_url', settings['instagram_url'] || '')} disabled={saving}>
                          Save
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="section-card">
                    <h2 className="section-title">Order Message Template</h2>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                      Use {'{books}'} as placeholder for the ordered books list.
                    </p>
                    <textarea
                      className="input"
                      rows={6}
                      value={settings['order_message_template'] || ''}
                      onChange={(e) => setSettings((prev) => ({ ...prev, order_message_template: e.target.value }))}
                      style={{ minHeight: 120, resize: 'vertical' }}
                    />
                    <button className="btn btn-primary" onClick={() => handleSave('order_message_template', settings['order_message_template'] || '')} disabled={saving} style={{ marginTop: 12 }}>
                      Save Template
                    </button>
                  </div>

                  <div className="section-card">
                    <h2 className="section-title">Contact Info</h2>
                    <div className="form-group">
                      <label className="label">Contact Email</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          className="input"
                          value={settings['contact_email'] || ''}
                          onChange={(e) => setSettings((prev) => ({ ...prev, contact_email: e.target.value }))}
                          placeholder="contact@berea.com"
                          style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={() => handleSave('contact_email', settings['contact_email'] || '')} disabled={saving}>
                          Save
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="label">Contact Phone</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          className="input"
                          value={settings['contact_phone'] || ''}
                          onChange={(e) => setSettings((prev) => ({ ...prev, contact_phone: e.target.value }))}
                          placeholder="+251..."
                          style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={() => handleSave('contact_phone', settings['contact_phone'] || '')} disabled={saving}>
                          Save
                        </button>
                       </div>
                     </div>
                   </div>
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
