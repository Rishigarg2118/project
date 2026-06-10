import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 18px',
    color: isActive(path) ? 'var(--white)' : 'var(--text-secondary)',
    textDecoration: 'none',
    borderRadius: '10px',
    fontFamily: 'var(--font-head)',
    fontWeight: '500',
    fontSize: '14px',
    background: isActive(path) ? 'linear-gradient(135deg, var(--primary) 0%, rgba(139, 92, 246, 0.4) 100%)' : 'transparent',
    border: isActive(path) ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
    boxShadow: isActive(path) ? '0 4px 12px rgba(139, 92, 246, 0.15)' : 'none',
    transition: 'var(--transition-smooth)',
    marginBottom: '8px'
  });

  const isHrOrAdmin = user.role === 'admin' || user.role === 'hr';
  const isManager = user.role === 'manager';

  return (
    <aside
      style={{
        width: '260px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: 'rgba(11, 15, 25, 0.75)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-glass)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100
      }}
    >
      {/* Brand logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '32px',
          paddingLeft: '8px'
        }}
      >
        <span
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '800',
            color: '#fff',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)'
          }}
        >
          I
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '20px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            background: 'linear-gradient(135deg, var(--white) 30%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          I-soft Portal
        </h2>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        <Link to="/dashboard" style={linkStyle('/dashboard')}>
          <span>📊</span> Dashboard
        </Link>
        
        {isHrOrAdmin && (
          <>
            <Link to="/employees" style={linkStyle('/employees')}>
              <span>👥</span> Directory
            </Link>
            <Link to="/departments" style={linkStyle('/departments')}>
              <span>🏢</span> Departments
            </Link>
            <Link to="/skills" style={linkStyle('/skills')}>
              <span>🛠️</span> Skills Master
            </Link>
          </>
        )}

        <Link to="/assets" style={linkStyle('/assets')}>
          <span>💻</span> Hardware Assets
        </Link>

        <Link to="/attendance" style={linkStyle('/attendance')}>
          <span>⏰</span> Clock In/Out
        </Link>

        <Link to="/leaves" style={linkStyle('/leaves')}>
          <span>🌴</span> Leave Balance
        </Link>

        {(isHrOrAdmin || isManager) && (
          <Link to="/approvals" style={linkStyle('/approvals')}>
            <span>✅</span> Leave Review
          </Link>
        )}

        {(isHrOrAdmin || isManager) && (
          <Link to="/reports" style={linkStyle('/reports')}>
            <span>📈</span> View Reports
          </Link>
        )}

        <Link to="/profile" style={linkStyle('/profile')}>
          <span>👤</span> My Profile
        </Link>
      </nav>

      {/* Bottom Profile Widget & Logout */}
      <div
        style={{
          borderTop: '1px solid var(--border-glass)',
          paddingTop: '20px',
          marginTop: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            paddingLeft: '8px'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid var(--border-glass-active)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--secondary)'
            }}
          >
            {user.name.charAt(0)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {user.name}
            </h4>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: '700',
                letterSpacing: '0.05em'
              }}
            >
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            color: 'var(--danger)',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(244, 63, 94, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
