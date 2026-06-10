import { useState } from 'react'
import { Card, Btn } from '../components/UI'

export default function AuthPage({ store, onLogin }) {
  const [tab, setTab]   = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' })
  const [err, setErr]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleLogin = async () => {
    setErr('')
    setLoading(true)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })

      if (!response.ok) {
        throw new Error('Invalid email or password')
      }

      const result = await response.json()
      const localUser = store.users.find((u) => u.email === form.email)
      const user = localUser
        ? { ...localUser, token: result.token }
        : { id: Date.now(), name: form.email, email: form.email, role: result.role, token: result.token }

      onLogin(user)
    } catch (err) {
      const localUser = store.users.find((u) => u.email === form.email && u.password === form.password)
      if (localUser) {
        onLogin(localUser)
      } else {
        setErr(err.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = () => {
    if (!form.name || !form.email || !form.password) { setErr('All fields required'); return }
    if (store.users.find((u) => u.email === form.email)) { setErr('Email already exists'); return }
    const newUser = { id: Date.now(), ...form }
    store.addUser(newUser)
    onLogin(newUser)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
    }}>
      <div style={{ width: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 36, fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--accent)' }}>
            EMS
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Employee Profile Management System
          </div>
        </div>

        <Card>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['login', 'signup'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErr('') }}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8,
                  fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)',
                  background: tab === t ? 'var(--accent)' : 'transparent',
                  color: tab === t ? '#fff' : 'var(--muted)',
                  border: tab === t ? 'none' : '1.5px solid var(--border)',
                  transition: 'all .18s',
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'signup' && (
              <input placeholder="Full Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            )}
            <input placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <input
              placeholder="Password" type="password"
              value={form.password} onChange={(e) => set('password', e.target.value)}
            />
            {tab === 'signup' && (
              <select value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            )}
            {err && <div style={{ color: 'var(--accent3)', fontSize: 13 }}>{err}</div>}
            <Btn
              onClick={tab === 'login' ? handleLogin : handleSignup}
              style={{ marginTop: 4 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </Btn>
            {tab === 'login' && (
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 4 }}>
                Demo: admin@demo.com / admin123
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
