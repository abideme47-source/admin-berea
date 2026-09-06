'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import { AdminContext } from '@/components/AdminGuard'

type Setting = { key: string; value: string }

export default function SettingsPage() {
  const admin = React.useContext(AdminContext)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const supabase = createClient()

  async function loadSettings() {
    setLoading(true)
    const { data } = await supabase.from('site_settings').select('*')
    const map: Record<string, string> = {}
    ;(data || []).forEach((s: Setting) => { map[s.key] = s.value || '' })
    setSettings(map)
    const { data: userData } = await supabase.auth.getUser()
    if (userData.user) {
      setName(userData.user.user_metadata?.name || '')
      setEmail(userData.user.email || '')
    }
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

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMessage('')
    const updates: any = { data: { name } }
    if (email !== admin?.email) {
      updates.email = email
    }
    const { error } = await supabase.auth.updateUser(updates)
    if (error) {
      setProfileMessage('Error: ' + error.message)
      setIsError(true)
    } else {
      setProfileMessage('Profile updated!')
      setIsError(false)
    }
    setProfileSaving(false)
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) {
      setProfileMessage('Please enter a new password')
      setIsError(true)
      return
    }
    setProfileSaving(true)
    setProfileMessage('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setProfileMessage('Error: ' + error.message)
      setIsError(true)
    } else {
      setProfileMessage('Password updated!')
      setIsError(false)
      setPassword('')
    }
    setProfileSaving(false)
  }

  if (loading) {
    return (
      <AdminGuard>
        <div className="admin-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--line)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading...</p>
          </div>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
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
                <h2 className="section-title">Profile</h2>
                {profileMessage && (
                  <p style={{ margin: '0 0 12px', padding: 10, borderRadius: 8, background: isError ? '#fee2e2' : '#dcfce7', color: isError ? '#dc2626' : '#16a34a', fontSize: 13, fontWeight: 600 }}>
                    {profileMessage}
                  </p>
                )}
                <form onSubmit={updateProfile}>
                  <div className="form-group">
                    <label className="label">Name</label>
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="form-group">
                    <label className="label">Email</label>
                    <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={profileSaving}>Update Profile</button>
                </form>
              </div>

              <div className="section-card">
                <h2 className="section-title">Change Password</h2>
                <form onSubmit={updatePassword}>
                  <div className="form-group">
                    <label className="label">New Password</label>
                    <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" minLength={6} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={profileSaving}>Change Password</button>
                </form>
              </div>

              {admin?.role === 'owner' && (
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
              )}

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
    </AdminGuard>
  )
}
