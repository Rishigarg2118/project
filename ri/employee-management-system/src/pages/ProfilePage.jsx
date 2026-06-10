import { Card, Tag } from '../components/UI'

export default function ProfilePage({ user, store }) {
  const { employees, depts, skills } = store
  const myEmp    = employees.find((e) => e.user_id === user.id)
  const dept     = myEmp ? depts.find((d) => d.id === myEmp.department_id) : null
  const mySkills = myEmp
    ? (myEmp.skill_ids || []).map((sid) => skills.find((s) => s.id === sid)?.skill_name).filter(Boolean)
    : []

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>
        My Profile
      </h1>

      <Card style={{ marginBottom: 18 }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#eff6ff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 32, overflow: 'hidden', flexShrink: 0,
          }}>
            {myEmp?.images?.[0]?.url
              ? <img src={myEmp.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : '👤'}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22 }}>{user.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 6 }}>{user.email}</div>
            <Tag color={user.role === 'admin' ? 'var(--accent3)' : 'var(--accent2)'}>{user.role}</Tag>
          </div>
        </div>

        {myEmp ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['Designation', myEmp.designation],
              ['Department',  dept?.department_name],
              ['Phone',       myEmp.phone],
              ['Salary',      `₹${Number(myEmp.salary).toLocaleString('en-IN')}`],
              ['Address',     myEmp.address],
              ['Joined',      new Date(myEmp.created_at).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {k}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>
            No employee profile linked to your account yet.
          </div>
        )}
      </Card>

      {mySkills.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>My Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {mySkills.map((s) => <Tag key={s} color="var(--accent2)">{s}</Tag>)}
          </div>
        </Card>
      )}

      {myEmp?.images?.length > 0 && (
        <Card style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Uploaded Documents</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {myEmp.images.map((img) => (
              <div key={img.id} style={{ textAlign: 'center' }}>
                <img
                  src={img.url} alt={img.label}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--border)' }}
                  onError={(e) => { e.target.style.opacity = '0.3' }}
                />
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{img.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
