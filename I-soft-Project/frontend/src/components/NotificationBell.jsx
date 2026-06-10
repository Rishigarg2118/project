import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const typeColor = {
  success: 'var(--success)',
  error: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--primary)',
};

const typeIcon = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: '💬',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [open, setOpen]                   = useState(false);
  const [loading, setLoading]             = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30s for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent fail */ }
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent fail */ } finally {
      setLoading(false);
    }
  };

  const markOneRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent fail */ }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
          border: '1px solid var(--border-glass)',
          borderRadius: '10px',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.2s ease',
          color: 'var(--text-primary)',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: 'var(--danger)',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: '800',
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            fontFamily: 'var(--font-head)',
            animation: 'pulse 2s infinite',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '48px',
          right: 0,
          width: '360px',
          maxHeight: '480px',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: 'var(--bg-card)',
            borderRadius: '16px 16px 0 0',
          }}>
            <div>
              <span style={{ fontWeight: '700', fontSize: '15px', fontFamily: 'var(--font-head)' }}>
                🔔 Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: '8px',
                  background: 'rgba(244,63,94,0.15)',
                  color: 'var(--danger)',
                  borderRadius: '20px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                style={{
                  fontSize: '11px',
                  color: 'var(--primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontWeight: '600',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>🔔</div>
              No notifications yet
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markOneRead(n.id)}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: n.is_read ? 'default' : 'pointer',
                  background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.06)',
                  transition: 'background 0.15s',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                {/* Type icon */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: `${typeColor[n.type] || 'var(--primary)'}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                }}>
                  {typeIcon[n.type] || '💬'}
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.is_read ? '500' : '700', fontSize: '13px', marginBottom: '3px' }}>
                    {n.title}
                    {!n.is_read && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', marginLeft: '6px', verticalAlign: 'middle' }} />
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.message}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
