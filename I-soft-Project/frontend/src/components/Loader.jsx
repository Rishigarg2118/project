import React from 'react';

export default function Loader({ fullPage = false, message = 'Loading...' }) {
  const containerStyle = fullPage
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--bg-gradient)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      };

  return (
    <div style={containerStyle} className="animate-fade-in">
      <div style={{ position: 'relative', width: '64px', height: '64px' }}>
        {/* Outer glowing ring */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '4px solid rgba(255, 255, 255, 0.05)',
            borderTopColor: 'var(--primary)',
            borderBottomColor: 'var(--secondary)',
            borderRadius: '50%',
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.25)',
          }}
        ></div>
        {/* Inner reverse spinner */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: '8px',
            bottom: '8px',
            border: '3px solid rgba(255, 255, 255, 0.02)',
            borderLeftColor: 'var(--success)',
            borderRightColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite reverse',
          }}
        ></div>
      </div>
      {message && (
        <p
          style={{
            marginTop: '20px',
            fontSize: '14px',
            fontFamily: 'var(--font-head)',
            fontWeight: '600',
            letterSpacing: '0.05em',
            color: 'var(--text-secondary)',
            animation: 'pulseGlow 2s infinite'
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
