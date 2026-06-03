import { useState } from 'react'
import { useStore }      from './store/useStore'
import Sidebar           from './components/Sidebar'
import AuthPage          from './pages/AuthPage'
import Dashboard         from './pages/Dashboard'
import EmployeeList      from './pages/EmployeeList'
import EmployeeForm      from './pages/EmployeeForm'
import DepartmentPage    from './pages/DepartmentPage'
import SkillsPage        from './pages/SkillsPage'
import ProfilePage       from './pages/ProfilePage'

export default function App() {
  const store   = useStore()
  const [user,   setUser]   = useState(null)
  const [page,   setPage]   = useState('dashboard')
  const [editId, setEditId] = useState(null)

  const handleLogin  = (u) => { setUser(u); setPage('dashboard') }
  const handleLogout = ()  => { setUser(null); setPage('dashboard') }

  if (!user) return <AuthPage store={store} onLogin={handleLogin} />

  const renderPage = () => {
    switch (page) {
      case 'dashboard':       return <Dashboard store={store} setPage={setPage} />
      case 'employees':       return <EmployeeList store={store} setPage={setPage} setEditId={setEditId} />
      case 'create-employee': return <EmployeeForm store={store} editId={null}   setPage={setPage} currentUser={user} />
      case 'edit-employee':   return <EmployeeForm store={store} editId={editId} setPage={setPage} currentUser={user} />
      case 'departments':     return <DepartmentPage store={store} />
      case 'skills':          return <SkillsPage store={store} />
      case 'profile':         return <ProfilePage user={user} store={store} />
      default:                return null
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar page={page} setPage={setPage} user={user} onLogout={handleLogout} />
      <main style={{
        marginLeft: 220, flex: 1,
        padding: '32px 36px',
        minHeight: '100vh',
        background: 'var(--bg)',
      }}>
        {renderPage()}
      </main>
    </div>
  )
}
