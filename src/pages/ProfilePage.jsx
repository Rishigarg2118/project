import { Card, Tag, Btn } from '../components/UI'

export default function ProfilePage({ user, store, setPage, setEditId }) {
  const { employees, depts, skills } = store
  const myEmp    = employees.find((e) => e.user_id === user.id)
  const dept     = myEmp ? depts.find((d) => d.id === myEmp.department_id) : null
  const mySkills = myEmp
    ? (myEmp.skill_ids || []).map((sid) => skills.find((s) => s.id === sid)?.skill_name).filter(Boolean)
    : []

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, color: '#0f172a' }}>
          My User Profile
        </h1>
        {myEmp && (
          <Btn
            small
            variant="ghost"
            onClick={() => {
              if (setEditId) setEditId(myEmp.id)
              if (setPage) setPage('edit-employee')
            }}
          >
            ✏️ Edit Profile
          </Btn>
        )}
      </div>

      <Card style={{ marginBottom: 20 }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            overflow: 'hidden',
            flexShrink: 0,
            border: '2px solid var(--border)',
          }}>
            {myEmp?.images?.[0]?.url ? (
              <img
                src={myEmp.images[0].url}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt=""
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              '👤'
            )}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, color: '#0f172a' }}>
              {user.name}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 6 }}>{user.email}</div>
            <Tag color={user.role === 'admin' ? 'var(--accent3)' : 'var(--accent2)'}>
              {user.role === 'admin' ? '👑 Administrator' : '👤 Employee Member'}
            </Tag>
          </div>
        </div>

        {myEmp ? (
          <div className="layout-grid-2col" style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
            {[
              ['Designation', myEmp.designation],
              ['Department',  dept?.department_name || 'General'],
              ['Contact Phone', myEmp.phone || '—'],
              ['Monthly Salary', `₹${Number(myEmp.salary || 0).toLocaleString('en-IN')}`],
              ['Office / Home Address', myEmp.address || '—'],
              ['Joined Date', new Date(myEmp.created_at).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 700 }}>
                  {k}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{v}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            color: 'var(--muted)',
            fontSize: 14,
            padding: '24px 16px',
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: 10,
            border: '1px dashed var(--border)',
          }}>
            <p style={{ marginBottom: 12 }}>No employee employment record is linked to this account yet.</p>
            {setPage && (
              <Btn small onClick={() => setPage('create-employee')}>
                + Link / Create Employee Profile
              </Btn>
            )}
          </div>
        )}
      </Card>

      {mySkills.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>My Registered Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {mySkills.map((s) => <Tag key={s} color="var(--accent2)">{s}</Tag>)}
          </div>
        </Card>
      )}

      {myEmp?.images?.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Attached Documents & Certificates</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {myEmp.images.map((img) => (
              <div key={img.id} style={{ textAlign: 'center', width: 90 }}>
                <div style={{
                  width: 90,
                  height: 90,
                  borderRadius: 10,
                  border: '1.5px solid var(--border)',
                  overflow: 'hidden',
                  background: '#f1f5f9',
                }}>
                  <img
                    src={img.url}
                    alt={img.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.opacity = '0.3' }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {img.label}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
