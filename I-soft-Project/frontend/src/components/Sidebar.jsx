import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;
  const getLinkClass = (path) => `sidebar-link ${isActive(path) ? 'active' : ''}`;

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
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--border-glass)',
        padding: '28px 18px',
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
          gap: '12px',
          marginBottom: '36px',
          paddingLeft: '6px'
        }}
      >
        <span
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '800',
            color: '#fff',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.35)'
          }}
        >
          I
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '0.04em',
            background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          I-soft Portal
        </h2>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        <Link to="/dashboard" className={getLinkClass('/dashboard')}>
          <span>📊</span> Dashboard
        </Link>
        
        {isHrOrAdmin && (
          <>
            <Link to="/employees" className={getLinkClass('/employees')}>
              <span>👥</span> Directory
            </Link>
            <Link to="/departments" className={getLinkClass('/departments')}>
              <span>🏢</span> Departments
            </Link>
            <Link to="/skills" className={getLinkClass('/skills')}>
              <span>🛠️</span> Skills Master
            </Link>
          </>
        )}

        <Link to="/assets" className={getLinkClass('/assets')}>
          <span>💻</span> Hardware Assets
        </Link>

        <Link to="/attendance" className={getLinkClass('/attendance')}>
          <span>⏰</span> Clock In/Out
        </Link>

        <Link to="/leaves" className={getLinkClass('/leaves')}>
          <span>🌴</span> Leave Balance
        </Link>

        {(isHrOrAdmin || isManager) && (
          <Link to="/approvals" className={getLinkClass('/approvals')}>
            <span>✅</span> Leave Review
          </Link>
        )}

        {(isHrOrAdmin || isManager) && (
          <Link to="/reports" className={getLinkClass('/reports')}>
            <span>📈</span> View Reports
          </Link>
        )}

        <Link to="/profile" className={getLinkClass('/profile')}>
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
            marginBottom: '18px',
            paddingLeft: '6px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-glow) 0%, var(--secondary-glow) 100%)',
              border: '1px solid var(--border-glass-active)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '17px',
              fontWeight: '800',
              color: 'var(--primary)'
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
                letterSpacing: '0.06em'
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
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            color: 'var(--danger)',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.18)';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.4)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(244, 63, 94, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.25)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
