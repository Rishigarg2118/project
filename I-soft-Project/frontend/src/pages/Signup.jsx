import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Button from '../components/Button';
import Card from '../components/Card';

export default function Signup() {
  const { signup, error: authError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMsg('');

    if (!name || !email || !password) {
      setValidationError('All fields are required.');
      return;
    }
    if (name.length < 2) {
      setValidationError('Name must be at least 2 characters long.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    setLocalLoading(true);
    try {
      await signup(name, email, password);
      setSuccessMsg('Account registered successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      // Handled by AuthContext
    } finally {
      setLocalLoading(false);
    }
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
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
              marginBottom: '16px'
            }}
          >
            🌟
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
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Register a new employee account
          </p>
        </div>

        {/* Signup Card */}
        <Card style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Validation Errors */}
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

            {/* Success message */}
            {successMsg && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--success)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}
              >
                ✅ {successMsg}
              </div>
            )}

            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={localLoading}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Work Email</label>
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={localLoading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password (min 6 characters)</label>
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
              {localLoading ? 'Registering...' : 'Register'}
            </Button>
          </form>

          {/* Direct login navigation */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: '600' }}>
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
