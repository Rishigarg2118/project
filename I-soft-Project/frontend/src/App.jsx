import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import useAuth from './hooks/useAuth';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import DepartmentMaster from './pages/DepartmentMaster';
import SkillsMaster from './pages/SkillsMaster';
import AssetManagement from './pages/AssetManagement';
import AttendancePortal from './pages/AttendancePortal';
import LeaveDashboard from './pages/LeaveDashboard';
import LeaveApproval from './pages/LeaveApproval';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

function MainLayout() {
  const { user, loading } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarVisible(!mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-gradient)' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
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

      <Sidebar visible={sidebarVisible} setVisible={setSidebarVisible} isMobile={isMobile} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        marginLeft: isMobile || !sidebarVisible ? 0 : '260px',
        transition: 'margin-left 0.3s ease',
      }}>
        {/* Top Header Bar */}
        <header style={{
          height: 64,
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
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
              color: 'var(--text-primary)',
              transition: 'background 0.2s',
            }}
          >
            ☰
          </button>
        </header>

        <main style={{ flex: 1, padding: isMobile ? '24px 16px' : '40px', minWidth: '0' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute allowedRoles={['admin', 'hr']}><EmployeeList /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute allowedRoles={['admin', 'hr']}><DepartmentMaster /></ProtectedRoute>} />
            <Route path="/skills" element={<ProtectedRoute allowedRoles={['admin', 'hr']}><SkillsMaster /></ProtectedRoute>} />
            <Route path="/assets" element={<ProtectedRoute><AssetManagement /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><AttendancePortal /></ProtectedRoute>} />
            <Route path="/leaves" element={<ProtectedRoute><LeaveDashboard /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}><LeaveApproval /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}><Reports /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
