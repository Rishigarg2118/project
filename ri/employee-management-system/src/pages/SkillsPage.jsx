import { useState } from 'react'
import { Card, Btn } from '../components/UI'

export default function SkillsPage({ store }) {
  const { skills, addSkill, deleteSkill } = store
  const [name, setName] = useState('')
  const [err,  setErr]  = useState('')

  const handleAdd = () => {
    if (!name.trim()) { setErr('Name required'); return }
    if (skills.find((s) => s.skill_name.toLowerCase() === name.toLowerCase())) {
      setErr('Already exists'); return
    }
    addSkill(name.trim())
    setName('')
    setErr('')
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>
        Skills
      </h1>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Add Skill</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            placeholder="Skill name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Btn onClick={handleAdd}>Add</Btn>
        </div>
        {err && <div style={{ color: 'var(--accent3)', fontSize: 13, marginTop: 8 }}>{err}</div>}
      </Card>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {skills.map((s) => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1.5px solid var(--border)',
            borderRadius: 30, padding: '8px 16px',
            boxShadow: 'var(--shadow)',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{s.skill_name}</span>
            <button
              onClick={() => deleteSkill(s.id)}
              style={{
                background: '#fef2f2', color: 'var(--accent3)',
                border: 'none', borderRadius: '50%',
                width: 20, height: 20, fontSize: 11, cursor: 'pointer',
              }}
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
