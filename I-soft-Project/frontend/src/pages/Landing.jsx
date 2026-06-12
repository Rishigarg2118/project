import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Landing() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 10% 20%, rgba(249, 115, 22, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(217, 119, 6, 0.08) 0%, transparent 40%), #fcfbfc',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Blur Spheres (Cool/Warm Harmony) */}
      <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--primary-glow)', filter: 'blur(150px)', opacity: 0.1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.15)', filter: 'blur(160px)', opacity: 0.1, pointerEvents: 'none' }}></div>

      {/* Header / Navbar */}
      <header style={{
        padding: '24px 8%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-glass)',
        backdropFilter: 'blur(12px)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo size={32} />
          <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-head)', letterSpacing: '0.04em' }}>
            Portal <span style={{ color: 'var(--primary)' }}>System</span>
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/login" style={{
            textDecoration: 'none',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: '600',
            padding: '8px 16px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
            Sign In
          </Link>
          <Link to="/signup" className="glow-btn" style={{
            textDecoration: 'none',
            fontSize: '14px',
            padding: '8px 20px',
            borderRadius: '10px'
          }}>
            Join Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 8%',
        zIndex: 10
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)',
          border: '1px solid rgba(0,0,0,0.05)',
          padding: '6px 16px',
          borderRadius: '30px',
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--primary)',
          marginBottom: '24px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🚀</span> Next-Gen Operations Portal
        </div>

        <h1 style={{
          fontFamily: 'var(--font-head)',
          fontSize: 'clamp(32px, 5vw, 64px)',
          fontWeight: '800',
          lineHeight: '1.15',
          maxWidth: '850px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, var(--text-primary) 40%, var(--text-secondary) 70%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Streamline Employee Profiles & Internal Audits
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'var(--text-secondary)',
          maxWidth: '620px',
          lineHeight: '1.6',
          marginBottom: '40px'
        }}>
          The Employee Management Portal System introduces a unified operations ecosystem. Track your hardware assets, record geofenced check-ins, and manage leaves—all in one secure place.
        </p>

        {/* Call to Actions (Warm and Cool Balanced) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginBottom: '60px' }}>
          <Link to="/login" className="glow-btn" style={{
            textDecoration: 'none',
            fontSize: '16px',
            padding: '14px 32px',
            borderRadius: '12px'
          }}>
            Access Operations Portal
          </Link>
          <Link to="/signup" style={{
            textDecoration: 'none',
            background: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid rgba(234, 88, 12, 0.35)',
            color: 'var(--text-primary)',
            fontSize: '16px',
            fontWeight: '600',
            padding: '14px 32px',
            borderRadius: '12px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--primary)';
            e.target.style.color = '#fff';
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.boxShadow = '0 8px 25px rgba(234, 88, 12, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.4)';
            e.target.style.color = 'var(--text-primary)';
            e.target.style.borderColor = 'rgba(234, 88, 12, 0.35)';
            e.target.style.boxShadow = 'none';
          }}>
            Register Account
          </Link>
        </div>

        {/* Features Preview Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '1100px'
        }}>
          {/* Card 1 */}
          <div className="glass-card" style={{ padding: '32px', textAlign: 'left' }}>
            <div style={{ fontSize: '28px', marginBottom: '16px' }}>⏰</div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Geofenced Attendance
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              Ensure compliance with secure client-side coordinate capturing during check-in. Manage remote and on-premise check-ins instantly.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card" style={{ padding: '32px', textAlign: 'left', borderTop: '2px solid rgba(234, 88, 12, 0.25)' }}>
            <div style={{ fontSize: '28px', marginBottom: '16px' }}>💻</div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Hardware Asset Registry
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              Track hardware inventory levels, allocate laptops and peripherals to developers, and log complete transfer histories.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card" style={{ padding: '32px', textAlign: 'left' }}>
            <div style={{ fontSize: '28px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Operations Dashboard
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              Interact with custom charts showing monthly leave pipelines, department distributions, system health, and work averages.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '30px 8%',
        borderTop: '1px solid var(--border-glass)',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--text-muted)',
        zIndex: 10
      }}>
        © 2026 Employee Management Portal System. All rights reserved.
      </footer>
    </div>
  );
}
