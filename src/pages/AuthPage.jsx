import { useState } from 'react'
import { Card, Btn } from '../components/UI'

export default function AuthPage({ store, onLogin }) {
  const [tab, setTab]   = useState('login')
  const [form, setForm] = useState({ name: '', email: 'admin@demo.com', password: 'admin123', role: 'admin' })
  const [err, setErr]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleLogin = (e) => {
    if (e?.preventDefault) e.preventDefault()
    setErr('')
    setLoading(true)

    const normalizedEmail = (form.email || '').trim().toLowerCase()
    const password = (form.password || '').trim()

    const foundUser = store.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
    )

    if (foundUser) {
      setLoading(false)
      onLogin(foundUser)
    } else {
      setLoading(false)
      setErr('Invalid email or password. Use demo credentials or sign up.')
    }
  }

  const handleQuickLogin = (email, password) => {
    setErr('')
    const foundUser = store.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (foundUser) {
      onLogin(foundUser)
    } else {
      // Fallback in case user was deleted
      const fallbackUser = { id: Date.now(), name: email.split('@')[0], email, role: 'admin' }
      store.addUser(fallbackUser)
      onLogin(fallbackUser)
    }
  }

  const handleSignup = (e) => {
    if (e?.preventDefault) e.preventDefault()
    setErr('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setErr('All fields are required')
      return
    }
    const emailLower = form.email.trim().toLowerCase()
    if (store.users.some((u) => u.email.toLowerCase() === emailLower)) {
      setErr('An account with this email already exists')
      return
    }

    const newUser = {
      id: Date.now(),
      name: form.name.trim(),
      email: emailLower,
      password: form.password,
      role: form.role || 'user',
    }
    store.addUser(newUser)
    onLogin(newUser)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, #eff6ff 0%, #f1f5f9 100%)',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
            fontSize: 26,
            color: '#fff',
            marginBottom: 12,
          }}>
            🏢
          </div>
          <div style={{ fontSize: 26, fontFamily: 'var(--font-head)', fontWeight: 800, color: '#0f172a' }}>
            i-SOFT Employee Portal
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Enterprise Employee Profile & Operations System
          </div>
        </div>

        <Card style={{ padding: 28 }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: 10,
            padding: 4,
            marginBottom: 20,
          }}>
            {['login', 'signup'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
                  setErr('')
                  if (t === 'signup') {
                    setForm({ name: '', email: '', password: '', role: 'user' })
                  } else {
                    setForm({ name: '', email: 'admin@demo.com', password: 'admin123', role: 'admin' })
                  }
                }}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? 'var(--accent)' : 'var(--muted)',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all .2s ease',
                }}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={tab === 'login' ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'signup' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 4 }}>Full Name</label>
                <input
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 4 }}>Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 4 }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
            </div>

            {tab === 'signup' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 4 }}>Role</label>
                <select value={form.role} onChange={(e) => set('role', e.target.value)}>
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>
            )}

            {err && (
              <div style={{
                color: 'var(--accent3)',
                fontSize: 13,
                background: '#fef2f2',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #fee2e2',
              }}>
                {err}
              </div>
            )}

            <Btn
              style={{ marginTop: 6, width: '100%', padding: '12px 0' }}
              disabled={loading}
            >
              {loading ? 'Please wait...' : tab === 'login' ? 'Sign In to Portal' : 'Register Account'}
            </Btn>
          </form>

          {/* 1-Click Quick Demo Access */}
          {tab === 'login' && (
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: 10 }}>
                ⚡ 1-Click Quick Demo Logins
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@demo.com', 'admin123')}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  👑 Admin Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('jane@demo.com', 'jane123')}
                  style={{
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    color: '#6d28d9',
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  👤 Employee Mode
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
