import { useState } from 'react'
import { Card, Btn } from '../components/UI'

const IMAGE_TYPES = ['Profile Photo', 'Aadhar Card', 'Resume', 'Certificate', 'Other']

export default function EmployeeForm({ store, editId, setPage, currentUser }) {
  const { users, depts, skills, addEmployee, updateEmployee, employees } = store
  const isEdit   = !!editId
  const existing = isEdit ? employees.find((e) => e.id === editId) : null

  const [form, setForm] = useState({
    user_id:       existing?.user_id       || (currentUser.role === 'user' ? currentUser.id : (users[0]?.id || '')),
    department_id: existing?.department_id || (depts[0]?.id || ''),
    phone:         existing?.phone         || '',
    address:       existing?.address       || '',
    designation:   existing?.designation   || '',
    salary:        existing?.salary        || '',
    skill_ids:     existing?.skill_ids     || [],
    images:        existing?.images        || [],
  })

  const [imageLabel, setImageLabel] = useState('Profile Photo')
  const [imageUrl, setImageUrl] = useState('')
  const [err, setErr] = useState('')

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const toggleSkill = (sid) =>
    setF('skill_ids', form.skill_ids.includes(sid)
      ? form.skill_ids.filter((s) => s !== sid)
      : [...form.skill_ids, sid])

  const handleAddUrlImage = () => {
    if (!imageUrl.trim()) {
      setErr('Please provide an image URL')
      return
    }
    if (form.images.length >= 5) {
      setErr('Maximum of 5 documents/images allowed per employee')
      return
    }
    setF('images', [...form.images, { id: Date.now(), label: imageLabel, url: imageUrl.trim() }])
    setImageUrl('')
    setErr('')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (form.images.length >= 5) {
      setErr('Maximum of 5 documents/images allowed per employee')
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result
      if (dataUrl) {
        setF('images', [...form.images, { id: Date.now(), label: imageLabel, url: dataUrl }])
        setErr('')
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeImage = (id) => setF('images', form.images.filter((i) => i.id !== id))

  const handleSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!form.user_id || !form.department_id || !form.designation.trim()) {
      setErr('User Account, Department, and Designation are required')
      return
    }

    const payload = {
      ...form,
      user_id: parseInt(form.user_id, 10),
      department_id: parseInt(form.department_id, 10),
      salary: Number(form.salary) || 0,
    }

    if (isEdit) {
      updateEmployee(editId, payload)
    } else {
      addEmployee(payload)
    }
    setPage('employees')
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, color: '#0f172a' }}>
            {isEdit ? 'Edit Employee Profile' : 'Create New Employee'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {isEdit ? 'Update details, documents, and skills' : 'Add complete professional record to company database'}
          </p>
        </div>
        <Btn variant="ghost" onClick={() => setPage('employees')}>Back to List</Btn>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic Info Card */}
        <Card>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            👤 Profile & Employment Details
          </div>
          <div className="layout-grid-2col">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                User Account *
              </label>
              <select
                value={form.user_id}
                onChange={(e) => setF('user_id', e.target.value)}
                disabled={currentUser.role !== 'admin' && isEdit}
              >
                <option value="">Select User Account</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                Department *
              </label>
              <select
                value={form.department_id}
                onChange={(e) => setF('department_id', e.target.value)}
              >
                <option value="">Select Department</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>{d.department_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                Job Title / Designation *
              </label>
              <input
                placeholder="e.g. Senior Full Stack Engineer"
                value={form.designation}
                onChange={(e) => setF('designation', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                Contact Phone
              </label>
              <input
                placeholder="e.g. +91 9876543210"
                value={form.phone}
                onChange={(e) => setF('phone', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                Monthly Salary (₹)
              </label>
              <input
                type="number"
                placeholder="85000"
                value={form.salary}
                onChange={(e) => setF('salary', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                Residential Address
              </label>
              <input
                placeholder="Office or home city address"
                value={form.address}
                onChange={(e) => setF('address', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Skills Card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>
              🎯 Technical & Professional Skills
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Selected: {form.skill_ids.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {skills.map((s) => {
              const sel = form.skill_ids.includes(s.id)
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleSkill(s.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    background: sel ? 'var(--accent)' : '#f8fafc',
                    color: sel ? '#fff' : 'var(--text)',
                    border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'all .15s ease',
                  }}
                >
                  {s.skill_name} {sel ? '✓' : '+'}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Documents & Image Upload */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>
              🖼️ Employee Media & Documents
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {form.images.length} / 5 max
            </span>
          </div>

          {/* Add Image Options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16, background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Document Type</label>
              <select value={imageLabel} onChange={(e) => setImageLabel(e.target.value)}>
                {IMAGE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Or Upload Local File</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ background: '#fff', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              placeholder="Or paste an Image URL (e.g. https://...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Btn type="button" onClick={handleAddUrlImage} variant="secondary" style={{ whiteSpace: 'nowrap' }}>
              Add URL
            </Btn>
          </div>

          {form.images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {form.images.map((img) => (
                <div key={img.id} style={{ position: 'relative', width: 90, textAlign: 'center' }}>
                  <div style={{
                    width: 90,
                    height: 90,
                    borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <img
                      src={img.url}
                      alt={img.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {img.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: 'var(--accent3)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {err && (
          <div style={{
            color: 'var(--accent3)',
            fontSize: 13,
            padding: '12px 16px',
            background: '#fef2f2',
            borderRadius: 8,
            border: '1px solid #fee2e2',
          }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <Btn style={{ padding: '12px 28px' }}>
            {isEdit ? 'Save Changes' : 'Create Employee Profile'}
          </Btn>
          <Btn type="button" variant="ghost" onClick={() => setPage('employees')}>
            Cancel
          </Btn>
        </div>
      </form>
    </div>
  )
}
