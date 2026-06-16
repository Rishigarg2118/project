import { useEffect, useState } from 'react'
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
  
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth >= 768)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    store.loadData?.()
    
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarVisible(!mobile)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarVisible && (
        <div 
          onClick={() => setSidebarVisible(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        page={page} 
        setPage={setPage} 
        user={user} 
        onLogout={handleLogout} 
        visible={sidebarVisible} 
        setVisible={setSidebarVisible} 
        isMobile={isMobile}
      />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        marginLeft: isMobile || !sidebarVisible ? 0 : 220,
        transition: 'margin-left 0.3s ease',
      }}>
        {/* Top Header Bar */}
        <header style={{
          height: 60,
          background: '#fff',
          borderBottom: '1.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 90,
        }}>
          <button 
            onClick={() => setSidebarVisible(!sidebarVisible)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8,
              borderRadius: 8,
              color: 'var(--text)',
              transition: 'background 0.2s',
            }}
          >
            ☰
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, marginLeft: 16, fontFamily: 'var(--font-head)' }}>
            {page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ')}
          </div>
        </header>

        <main style={{
          flex: 1,
          padding: isMobile ? '20px 16px' : '32px 36px',
          background: 'var(--bg)',
        }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
