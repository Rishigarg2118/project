import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/Button';
import Card from '../components/Card';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Request, 2 = Verify & Reset
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Demo mode OTP capture
  const [demoCode, setDemoCode] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Please enter your work email.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLocalLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setDemoCode(res.data.resetCode);
      setSuccessMsg('Reset code generated successfully!');
      setTimeout(() => {
        setStep(2);
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate reset code.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!code || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLocalLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { email, code, newPassword });
      setSuccessMsg('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
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
            🔑
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '28px',
              fontWeight: '800',
              letterSpacing: '0.02em',
              background: 'linear-gradient(135deg, var(--text-primary) 40%, var(--text-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}
          >
            Reset Password
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {step === 1 ? 'Request a security verification code' : 'Verify reset code and enter new password'}
          </p>
        </div>

        {/* Card Frame */}
        <Card style={{ padding: '36px' }}>
          {/* Validation Errors */}
          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--danger)',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '13px',
                lineHeight: '1.4',
                marginBottom: '20px'
              }}
            >
              ⚠️ {error}
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
                lineHeight: '1.4',
                marginBottom: '20px'
              }}
            >
              ✅ {successMsg}
            </div>
          )}

          {/* Demo helper OTP container */}
          {demoCode && (
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px dashed var(--primary)',
                padding: '14px',
                borderRadius: '10px',
                color: 'var(--primary)',
                fontSize: '13px',
                lineHeight: '1.5',
                marginBottom: '20px',
                textAlign: 'center'
              }}
            >
              <strong>🔒 Demo Sandbox OTP</strong>
              <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '6px', letterSpacing: '2px' }}>
                {demoCode}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Use this code to verify your request in Step 2.
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

              <Button
                type="submit"
                variant="primary"
                disabled={localLoading}
                style={{ width: '100%', height: '48px', marginTop: '10px' }}
              >
                {localLoading ? 'Sending...' : 'Request Reset Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label htmlFor="code">6-Digit Verification Code</label>
                <input
                  id="code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={localLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password (min 6 characters)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={localLoading}
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={localLoading}
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                  >
                    {showConfirmPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={localLoading}
                style={{ width: '100%', height: '48px', marginTop: '10px' }}
              >
                {localLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* Back to Login */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Remembered password?{' '}
            <Link to="/login" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: '600' }}>
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
