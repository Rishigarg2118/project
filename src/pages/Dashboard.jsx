import { Card, Tag, Btn } from '../components/UI'

export default function Dashboard({ store, setPage }) {
  const { stats, employees, depts, skills, users, resetToDemoData } = store

  const cards = [
    { label: 'Total Employees', value: stats.employees, color: '#2563eb', icon: '👥' },
    { label: 'Departments',     value: stats.departments, color: '#7c3aed', icon: '🏢' },
    { label: 'Active Skills',    value: stats.skills,      color: '#f59e0b', icon: '🎯' },
    { label: 'Uploaded Docs',   value: stats.images,      color: '#10b981', icon: '📎' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, marginBottom: 4, color: '#0f172a' }}>
            Executive Dashboard
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Real-time overview of personnel, departments, and corporate records
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" onClick={resetToDemoData} small>
            ↻ Reset Demo Data
          </Btn>
          <Btn onClick={() => setPage('create-employee')} small>
            + Add Employee
          </Btn>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid-classic" style={{ marginBottom: 28 }}>
        {cards.map((c) => (
          <Card key={c.label} style={{ borderLeft: `4px solid ${c.color}`, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: 32, fontFamily: 'var(--font-head)', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {c.value}
                </div>
              </div>
              <div style={{
                fontSize: 26,
                background: `${c.color}15`,
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {c.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="layout-grid-2col">
        {/* Recent Employees */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>
              Recent Personnel
            </div>
            <button
              onClick={() => setPage('employees')}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {employees.slice(-4).reverse().map((emp) => {
              const u = users.find((usr) => usr.id === emp.user_id)
              const d = depts.find((dept) => dept.id === emp.department_id)
              return (
                <div
                  key={emp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1.5px solid var(--border)',
                  }}>
                    {emp.images?.[0]?.url ? (
                      <img src={emp.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {u?.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {emp.designation || 'No designation'}
                    </div>
                  </div>
                  <Tag>{d?.department_name || 'General'}</Tag>
                </div>
              )
            })}
            {employees.length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                No employees registered yet.
              </div>
            )}
          </div>
        </Card>

        {/* Database & System Relationships Architecture */}
        <Card>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
            Relational Data Schema (PostgreSQL)
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
            1. Employee ↔ Department (One-to-Many):
          </div>
          <pre style={{
            background: '#f0f9ff',
            borderRadius: 8,
            padding: 12,
            fontSize: 11,
            color: '#1d4ed8',
            overflowX: 'auto',
            lineHeight: 1.5,
            border: '1px solid #bfdbfe',
            marginBottom: 12,
          }}>{`SELECT u.name, d.department_name, ep.designation
FROM employee_profiles ep
INNER JOIN users u ON ep.user_id = u.id
INNER JOIN departments d ON ep.department_id = d.id;`}</pre>

          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
            2. Employee ↔ Skills (Many-to-Many):
          </div>
          <pre style={{
            background: '#faf5ff',
            borderRadius: 8,
            padding: 12,
            fontSize: 11,
            color: '#6d28d9',
            overflowX: 'auto',
            lineHeight: 1.5,
            border: '1px solid #ddd6fe',
          }}>{`SELECT u.name, s.skill_name
FROM employee_skills es
JOIN employee_profiles ep ON es.employee_id = ep.id
JOIN users u ON ep.user_id = u.id
JOIN skills s ON es.skill_id = s.id;`}</pre>
        </Card>
      </div>
    </div>
  )
}
