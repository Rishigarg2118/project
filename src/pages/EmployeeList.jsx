import { useState } from 'react'
import { Card, Btn, Tag } from '../components/UI'

export default function EmployeeList({ store, setPage, setEditId }) {
  const { employees, users, depts, skills, deleteEmployee } = store
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('all')

  const filtered = employees.filter((e) => {
    const u = users.find((usr) => usr.id === e.user_id)
    const matchesSearch =
      !search ||
      (u?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.designation || '').toLowerCase().includes(search.toLowerCase())

    const matchesDept = filterDept === 'all' || e.department_id === Number(filterDept)

    return matchesSearch && matchesDept
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, color: '#0f172a' }}>
            Employees Directory
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Showing {filtered.length} of {employees.length} registered personnel
          </p>
        </div>
        <Btn onClick={() => setPage('create-employee')}>+ Add New Employee</Btn>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Search by name, designation, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360, background: '#fff' }}
        />
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          style={{ maxWidth: 220, background: '#fff' }}
        >
          <option value="all">All Departments</option>
          {depts.map((d) => (
            <option key={d.id} value={d.id}>{d.department_name}</option>
          ))}
        </select>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                {['Employee', 'Department', 'Designation', 'Salary', 'Skills', 'Docs', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '14px 18px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const u = users.find((usr) => usr.id === emp.user_id)
                const d = depts.find((dept) => dept.id === emp.department_id)
                const empSkills = (emp.skill_ids || [])
                  .map((sid) => skills.find((s) => s.id === sid)?.skill_name)
                  .filter(Boolean)

                return (
                  <tr
                    key={emp.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Employee Profile */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: '#eff6ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: '1.5px solid var(--border)',
                          fontSize: 18,
                        }}>
                          {emp.images?.[0]?.url ? (
                            <img
                              src={emp.images[0].url}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              alt=""
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{u?.name || 'Unknown User'}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u?.email || 'No email registered'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '14px 18px' }}>
                      <Tag>{d?.department_name || 'Unassigned'}</Tag>
                    </td>

                    {/* Designation */}
                    <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 500 }}>
                      {emp.designation || '—'}
                    </td>

                    {/* Salary */}
                    <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                      ₹{Number(emp.salary || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Skills */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {empSkills.slice(0, 3).map((s) => (
                          <Tag key={s} color="var(--accent2)">{s}</Tag>
                        ))}
                        {empSkills.length > 3 && (
                          <Tag color="var(--muted)">+{empSkills.length - 3}</Tag>
                        )}
                        {empSkills.length === 0 && (
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>None</span>
                        )}
                      </div>
                    </td>

                    {/* Documents */}
                    <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--muted)' }}>
                      📎 {emp.images?.length || 0}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn
                          small
                          variant="ghost"
                          onClick={() => {
                            setEditId(emp.id)
                            setPage('edit-employee')
                          }}
                        >
                          Edit
                        </Btn>
                        <Btn
                          small
                          variant="danger"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${u?.name || 'this employee'}?`)) {
                              deleteEmployee(emp.id)
                            }
                          }}
                        >
                          Delete
                        </Btn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>No employees found</div>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
              {search ? 'Try adjusting your search criteria.' : 'Get started by creating your first employee profile.'}
            </p>
            <Btn onClick={() => setPage('create-employee')}>+ Add Employee</Btn>
          </div>
        )}
      </Card>
    </div>
  )
}
