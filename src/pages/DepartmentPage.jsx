import { useState } from 'react'
import { Card, Btn, Tag } from '../components/UI'

export default function DepartmentPage({ store }) {
  const { depts, addDept, deleteDept, employees } = store
  const [name, setName] = useState('')
  const [err,  setErr]  = useState('')

  const handleAdd = () => {
    if (!name.trim()) { setErr('Name required'); return }
    if (depts.find((d) => d.department_name.toLowerCase() === name.toLowerCase())) {
      setErr('Already exists'); return
    }
    addDept(name.trim())
    setName('')
    setErr('')
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>
        Departments
      </h1>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Add Department</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            placeholder="Department name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Btn onClick={handleAdd}>Add</Btn>
        </div>
        {err && <div style={{ color: 'var(--accent3)', fontSize: 13, marginTop: 8 }}>{err}</div>}
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {depts.map((d) => {
          const empCount = employees.filter((e) => e.department_id === d.id).length
          return (
            <Card key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{d.department_name}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 10 }}>
                  {empCount} employee{empCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag>{d.department_name}</Tag>
                <Btn small variant="danger" onClick={() => deleteDept(d.id)}>Remove</Btn>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
