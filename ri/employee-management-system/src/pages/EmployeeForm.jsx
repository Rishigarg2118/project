import { useState } from 'react'
import { Card, Btn } from '../components/UI'

const IMAGE_TYPES = ['Profile Photo', 'Aadhar Card', 'Resume', 'Certificate', 'Other']

export default function EmployeeForm({ store, editId, setPage, currentUser }) {
  const { users, depts, skills, addEmployee, updateEmployee, employees } = store
  const isEdit   = !!editId
  const existing = isEdit ? employees.find((e) => e.id === editId) : null

  const [form, setForm] = useState({
    user_id:       existing?.user_id       || (currentUser.role === 'user' ? currentUser.id : ''),
    department_id: existing?.department_id || '',
    phone:         existing?.phone         || '',
    address:       existing?.address       || '',
    designation:   existing?.designation   || '',
    salary:        existing?.salary        || '',
    skill_ids:     existing?.skill_ids     || [],
    images:        existing?.images        || [],
  })
  const [imageForm, setImageForm] = useState({ label: 'Profile Photo', url: '' })
  const [err, setErr] = useState('')

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const toggleSkill = (sid) =>
    setF('skill_ids', form.skill_ids.includes(sid)
      ? form.skill_ids.filter((s) => s !== sid)
      : [...form.skill_ids, sid])

  const addImage = () => {
    if (!imageForm.url)          { setErr('Image URL required'); return }
    if (form.images.length >= 5) { setErr('Max 5 images');       return }
    setF('images', [...form.images, { id: Date.now(), ...imageForm }])
    setImageForm({ label: 'Profile Photo', url: '' })
    setErr('')
  }

  const removeImage = (id) => setF('images', form.images.filter((i) => i.id !== id))

  const handleSubmit = () => {
    if (!form.user_id || !form.department_id || !form.designation) {
      setErr('User, Department, and Designation are required')
      return
    }
    if (isEdit) {
      updateEmployee(editId, form)
    } else {
      addEmployee({ ...form, user_id: parseInt(form.user_id), department_id: parseInt(form.department_id) })
    }
    setPage('employees')
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28 }}>
          {isEdit ? 'Edit' : 'Create'} Employee
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          {isEdit ? 'Update employee profile details' : 'Fill in the form to add a new employee profile'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Basic Info */}
        <Card>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 16 }}>
            Basic Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>User Account *</label>
              <select
                value={form.user_id}
                onChange={(e) => setF('user_id', e.target.value)}
                disabled={currentUser.role !== 'admin'}
              >
                <option value="">Select User</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Department *</label>
              <select value={form.department_id} onChange={(e) => setF('department_id', e.target.value)}>
                <option value="">Select Department</option>
                {depts.map((d) => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Designation *</label>
              <input placeholder="e.g. Senior Developer" value={form.designation} onChange={(e) => setF('designation', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Phone</label>
              <input placeholder="10-digit mobile" value={form.phone} onChange={(e) => setF('phone', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Salary (₹)</label>
              <input type="number" placeholder="85000" value={form.salary} onChange={(e) => setF('salary', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Address</label>
              <input placeholder="Full address" value={form.address} onChange={(e) => setF('address', e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Skills */}
        <Card>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 16 }}>
            Assign Skills{' '}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>(Many-to-Many)</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {skills.map((s) => {
              const sel = form.skill_ids.includes(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSkill(s.id)}
                  style={{
                    padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    background: sel ? 'var(--accent2)' : '#f8fafc',
                    color: sel ? '#fff' : 'var(--muted)',
                    border: `1.5px solid ${sel ? 'var(--accent2)' : 'var(--border)'}`,
                    transition: 'all .15s',
                  }}
                >
                  {s.skill_name} {sel ? '✓' : '+'}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Image Upload */}
        <Card>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 16 }}>
            Image Upload{' '}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>
              ({form.images.length}/5 max)
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, marginBottom: 16 }}>
            <select value={imageForm.label} onChange={(e) => setImageForm((p) => ({ ...p, label: e.target.value }))}>
              {IMAGE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input
              placeholder="Image URL (e.g. https://i.pravatar.cc/150?img=1)"
              value={imageForm.url}
              onChange={(e) => setImageForm((p) => ({ ...p, url: e.target.value }))}
            />
            <Btn onClick={addImage} variant="secondary" style={{ whiteSpace: 'nowrap' }}>Add Image</Btn>
          </div>
          {form.images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {form.images.map((img) => (
                <div key={img.id} style={{ position: 'relative', textAlign: 'center' }}>
                  <img
                    src={img.url} alt={img.label}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--border)', display: 'block' }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{img.label}</div>
                  <button
                    onClick={() => removeImage(img.id)}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      background: 'var(--accent3)', color: '#fff', border: 'none',
                      borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer',
                    }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {err && (
          <div style={{ color: 'var(--accent3)', fontSize: 13, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={handleSubmit}>{isEdit ? 'Save Changes' : 'Create Employee'}</Btn>
          <Btn variant="ghost" onClick={() => setPage('employees')}>Cancel</Btn>
        </div>
      </div>
    </div>
  )
}
