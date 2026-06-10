import { Btn } from './UI'

const MENU = [
  { id: 'dashboard',       label: 'Dashboard',    icon: '⬛' },
  { id: 'employees',       label: 'Employees',    icon: '👥' },
  { id: 'create-employee', label: 'Add Employee', icon: '➕' },
  { id: 'departments',     label: 'Departments',  icon: '🏢' },
  { id: 'skills',          label: 'Skills',       icon: '🎯' },
  { id: 'profile',         label: 'My Profile',   icon: '👤' },
]

export default function Sidebar({ page, setPage, user, onLogout }) {
  return (
    <div style={{
      width: 220,
      background: '#fff',
      borderRight: '1.5px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 100,
      boxShadow: '2px 0 12px rgba(0,0,0,0.05)',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 22, fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--accent)' }}>
          EMS
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Employee Management</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {MENU.map((m) => (
          <button
            key={m.id}
            onClick={() => setPage(m.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              width: '100%', padding: '9px 12px', borderRadius: 9, marginBottom: 2,
              fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
              background: page === m.id ? '#eff6ff' : 'transparent',
              color: page === m.id ? 'var(--accent)' : 'var(--muted)',
              border: page === m.id ? '1px solid #bfdbfe' : '1px solid transparent',
              textAlign: 'left', transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: 16 }}>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '16px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{user.email}</div>
        <Btn variant="ghost" onClick={onLogout} small style={{ width: '100%' }}>Sign Out</Btn>
      </div>
    </div>
  )
}
