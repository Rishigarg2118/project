import { useState } from 'react'
import { Card, Btn, Tag } from '../components/UI'

export default function EmployeeList({ store, setPage, setEditId }) {
  const { employees, users, depts, skills, deleteEmployee } = store
  const [search, setSearch] = useState('')

  const filtered = employees.filter((e) => {
    const u = users.find((u) => u.id === e.user_id)
    return (
      !search ||
      u?.name.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28 }}>Employees</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{filtered.length} records</p>
        </div>
        <Btn onClick={() => setPage('create-employee')}>+ Add Employee</Btn>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Search by name or designation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Employee', 'Department', 'Designation', 'Salary', 'Skills', 'Images', 'Actions'].map((h) => (
                <th key={h} style={{
                  padding: '14px 16px', textAlign: 'left',
                  fontSize: 12, fontWeight: 700, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => {
              const u       = users.find((u) => u.id === emp.user_id)
              const d       = depts.find((d) => d.id === emp.department_id)
              const empSkills = (emp.skill_ids || [])
                .map((sid) => skills.find((s) => s.id === sid)?.skill_name)
                .filter(Boolean)

              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  {/* Employee */}
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
                        background: '#eff6ff', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0,
                      }}>
                        {emp.images?.[0]?.url
                          ? <img src={emp.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          : <span>👤</span>}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{u?.name || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <Tag>{d?.department_name || '—'}</Tag>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13 }}>{emp.designation}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--accent)' }}>
                    ₹{Number(emp.salary).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {empSkills.slice(0, 3).map((s) => (
                        <Tag key={s} color="var(--accent2)">{s}</Tag>
                      ))}
                      {empSkills.length > 3 && <Tag color="var(--muted)">+{empSkills.length - 3}</Tag>}
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13 }}>{emp.images?.length || 0}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn small variant="ghost" onClick={() => { setEditId(emp.id); setPage('edit-employee') }}>
                        Edit
                      </Btn>
                      <Btn small variant="danger" onClick={() => deleteEmployee(emp.id)}>Del</Btn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
            No employees found.
          </div>
        )}
      </Card>
    </div>
  )
}
