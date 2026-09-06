'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/BottomNav'
import AdminHeader from '@/components/AdminHeader'
import { AdminContext } from '@/components/AdminGuard'

export default function ProfilePage() {
  const router = useRouter()
  const admin = React.useContext(AdminContext)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setName(data.user.user_metadata?.name || '')
        setEmail(data.user.email || '')
      }
    }
    load()
  }, [])

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const updates: any = { data: { name } }
    if (email !== admin?.email) {
      updates.email = email
    }

    const { error } = await supabase.auth.updateUser(updates)
    if (error) {
      setMessage('Error: ' + error.message)
      setIsError(true)
    } else {
      setMessage('Profile updated!')
      setIsError(false)
    }
    setSaving(false)
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) {
      setMessage('Please enter a new password')
      setIsError(true)
      return
    }
    setSaving(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage('Error: ' + error.message)
      setIsError(true)
    } else {
      setMessage('Password updated!')
      setIsError(false)
      setPassword('')
    }
    setSaving(false)
  }

  return (
    <AdminGuard>
      <div className="admin-page">
        <AdminHeader title="Profile" />
        <main className="admin-content">
          <div className="section-card">
            <h2 className="section-title">Profile Information</h2>
            {message && (
              <p style={{ margin: '0 0 12px', padding: 10, borderRadius: 8, background: isError ? '#fee2e2' : '#dcfce7', color: isError ? '#dc2626' : '#16a34a', fontSize: 13, fontWeight: 600 }}>
                {message}
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
              <button type="submit" className="btn btn-primary" disabled={saving}>Update Profile</button>
            </form>
          </div>

          <div className="section-card">
            <h2 className="section-title">Change Password</h2>
            <form onSubmit={updatePassword}>
              <div className="form-group">
                <label className="label">New Password</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>Change Password</button>
            </form>
          </div>
        </main>
        <BottomNav />
      </div>
    </AdminGuard>
  )
}
