'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const client = createClient()
    client.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
      if (data.user) {
        const { data: adminRecord } = await client
          .from('admins')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()
        if (adminRecord) {
          router.push('/')
          router.refresh()
        } else {
          await client.auth.signOut()
        }
      }
    })
  }, [router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) {
      setError('Login failed.')
      setLoading(false)
      return
    }

    const { data: adminRecord } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!adminRecord) {
      await supabase.auth.signOut()
      setError('This account does not have admin access.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Admin Login</h1>
        <p>Sign in to manage Berea Books</p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
          <a href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Back to store
          </a>
        </p>
      </div>
    </div>
  )
}
