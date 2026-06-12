import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Button from '../components/Button';
import Card from '../components/Card';

export default function Login() {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    
    // Quick Joi-like frontend check
    if (!email || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }
    const isEmail = /\S+@\S+\.\S+/.test(email);
    const isPhone = /^[0-9+() -]{10,20}$/.test(email);
    if (!isEmail && !isPhone) {
      setValidationError('Please enter a valid email address or phone number.');
      return;
    }

    setLocalLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Handled by AuthContext
    } finally {
      setLocalLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px'
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeIn 0.5s ease-out' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '800',
              color: '#fff',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
              marginBottom: '16px'
            }}
          >
            ⚡
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '28px',
              fontWeight: '800',
              letterSpacing: '0.02em',
              background: 'linear-gradient(135deg, #fff 40%, var(--text-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Access the I-soft enterprise management system
          </p>
        </div>

        {/* Login Card */}
        <Card style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Errors */}
            {(validationError || authError) && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--danger)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}
              >
                ⚠️ {validationError || authError}
              </div>
            )}

            {/* Email / Phone */}
            <div className="form-group">
              <label htmlFor="email">Work Email or Phone Number</label>
              <input
                id="email"
                type="text"
                placeholder="name@company.com or +1234567890"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={localLoading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" style={{ color: 'var(--secondary)', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>
                  Forgot Password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={localLoading}
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              disabled={localLoading}
              style={{ width: '100%', height: '48px', marginTop: '10px' }}
            >
              {localLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          {/* Direct registration navigation */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            New employee?{' '}
            <Link to="/signup" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: '600' }}>
              Register Here
            </Link>
          </div>
        </Card>

        {/* Quick Demo Logins */}
        <div
          style={{
            marginTop: '24px',
            background: 'var(--surface-glass)',
            border: '1px solid var(--border-glass)',
            borderRadius: '14px',
            padding: '16px 20px',
            textAlign: 'center'
          }}
        >
          <h5
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-head)',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}
          >
            🔑 Demo Quick Logins
          </h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => handleQuickLogin('admin@demo.com', 'admin123')}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-glass)',
                padding: '6px 12px',
                borderRadius: '6px',
                color: 'var(--primary)',
                fontSize: '11px',
                fontWeight: '600'
              }}
            >
              Admin (Full Control)
            </button>
            <button
              onClick={() => handleQuickLogin('hr@demo.com', 'hr123')}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-glass)',
                padding: '6px 12px',
                borderRadius: '6px',
                color: 'var(--secondary)',
                fontSize: '11px',
                fontWeight: '600'
              }}
            >
              HR (Manager role)
            </button>
            <button
              onClick={() => handleQuickLogin('jane@demo.com', 'jane123')}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-glass)',
                padding: '6px 12px',
                borderRadius: '6px',
                color: 'var(--success)',
                fontSize: '11px',
                fontWeight: '600'
              }}
            >
              Employee (Jane Smith)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
