import { Card, Tag, Btn } from '../components/UI'

export default function Dashboard({ store, setPage }) {
  const { stats, employees, depts, skills, users } = store

  const cards = [
    { label: 'Total Employees', value: stats.employees, color: 'var(--accent)',  icon: '👥' },
    { label: 'Departments',     value: stats.departments, color: 'var(--accent2)', icon: '🏢' },
    { label: 'Skills',          value: stats.skills,      color: '#f59e0b',        icon: '🎯' },
    { label: 'Uploaded Images', value: stats.images,      color: 'var(--accent3)', icon: '🖼️' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Overview of your employee management system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid-classic">
        {cards.map((c) => (
          <Card key={c.label} style={{ borderLeft: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 32, fontFamily: 'var(--font-head)', fontWeight: 800, color: c.color }}>
              {c.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="layout-grid-2col">
        {/* Recent Employees */}
        <Card>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            Recent Employees
          </div>
          {employees.slice(-4).reverse().map((emp) => {
            const u = users.find((u) => u.id === emp.user_id)
            const d = depts.find((d) => d.id === emp.department_id)
            return (
              <div key={emp.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#eff6ff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16, overflow: 'hidden', flexShrink: 0,
                }}>
                  {emp.images?.[0]?.url
                    ? <img src={emp.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '👤'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{u?.name || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{emp.designation}</div>
                </div>
                <Tag>{d?.department_name || '—'}</Tag>
              </div>
            )
          })}
          {employees.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>No employees yet.</div>
          )}
        </Card>

        {/* SQL JOINs */}
        <Card>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            SQL JOIN Queries
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Employee ↔ Department</div>
          <pre style={{
            background: '#f0f9ff', borderRadius: 8, padding: 12,
            fontSize: 11, color: '#1d4ed8', overflowX: 'auto',
            lineHeight: 1.6, border: '1px solid #bfdbfe',
          }}>{`SELECT u.name, d.department_name
FROM employee_profiles ep
INNER JOIN users u ON ep.user_id = u.id
INNER JOIN departments d
  ON ep.department_id = d.id;`}</pre>

          <div style={{ fontSize: 13, color: 'var(--muted)', margin: '14px 0 8px' }}>Employee ↔ Skills</div>
          <pre style={{
            background: '#faf5ff', borderRadius: 8, padding: 12,
            fontSize: 11, color: '#6d28d9', overflowX: 'auto',
            lineHeight: 1.6, border: '1px solid #ddd6fe',
          }}>{`SELECT u.name, s.skill_name
FROM employee_skills es
INNER JOIN employee_profiles ep
  ON es.employee_id = ep.id
INNER JOIN users u ON ep.user_id = u.id
INNER JOIN skills s ON es.skill_id = s.id;`}</pre>
        </Card>
      </div>
    </div>
  )
}
