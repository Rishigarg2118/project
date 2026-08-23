import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Button from '../components/Button';
import Card from '../components/Card';
import Logo from '../components/Logo';
import axios from 'axios';

export default function ChangePassword() {
  const { user, updateProfileLocal } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setSuccess('Password updated successfully! Redirecting to dashboard...');
      
      // Update local auth context user record
      if (updateProfileLocal) {
        updateProfileLocal({ requiresPasswordReset: false });
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        background: 'var(--bg-gradient)'
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeIn 0.5s ease-out' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Logo size={48} style={{ marginBottom: '16px' }} />
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
            Reset Password Required
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Please set a new secure password for your first login
          </p>
        </div>

        {/* Card */}
        <Card style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--danger)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px'
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--success)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px'
                }}
              >
                🎉 {success}
              </div>
            )}

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Current Temporary Password
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" loading={loading} style={{ marginTop: '10px' }}>
              Update Password & Enter
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
