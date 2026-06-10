import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Loader from '../components/Loader';
import axios from 'axios';

export default function AttendancePortal() {
  const [time, setTime] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({ checkedIn: false, record: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [locationType, setLocationType] = useState('Office - Gwalior');
  const [customNotes, setCustomNotes] = useState('');
  
  // Active clock-in timer
  const [elapsed, setElapsed] = useState('');

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch status and logs
  useEffect(() => {
    fetchLogsAndStatus();
  }, []);

  // Active session duration tracker
  useEffect(() => {
    let elapsedTimer;
    if (status.checkedIn && status.record?.check_in_time) {
      const checkInMs = new Date(status.record.check_in_time).getTime();
      const updateElapsed = () => {
        const diffMs = Date.now() - checkInMs;
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        setElapsed(
          `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
            .toString()
            .padStart(2, '0')}`
        );
      };
      updateElapsed();
      elapsedTimer = setInterval(updateElapsed, 1000);
    } else {
      setElapsed('');
    }
    return () => clearInterval(elapsedTimer);
  }, [status]);

  const fetchLogsAndStatus = async () => {
    setLoading(true);
    try {
      const [statusRes, logsRes] = await Promise.all([
        axios.get('/api/attendance/today-status'),
        axios.get('/api/attendance/my-logs')
      ]);
      setStatus(statusRes.data);
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync check-in portal records');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await axios.post('/api/attendance/check-in', {
        location: locationType,
        notes: customNotes
      });
      setCustomNotes('');
      await fetchLogsAndStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register clock-in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setError(null);
    setLoading(true);
    try {
      await axios.post('/api/attendance/check-out', {
        notes: 'Check-out registered'
      });
      await fetchLogsAndStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register clock-out');
    } finally {
      setLoading(false);
    }
  };

  const headers = [
    { label: 'Date' },
    { label: 'Check In Time' },
    { label: 'Check Out Time' },
    { label: 'Location' },
    { label: 'Notes' },
    { label: 'Worked Duration' }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <header style={{ marginBottom: '36px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #fff 50%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}
        >
          Check-in Portal
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Record daily entry, check-out times, locations, and total duration logs.
        </p>
      </header>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--danger)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '36px' }}>
        {/* Interactive Clock & Session Status */}
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px' }}>
          {/* Digital Clock */}
          <div
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '44px',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '0.02em',
              textShadow: '0 0 20px rgba(6, 182, 212, 0.25)',
              marginBottom: '8px'
            }}
          >
            {time.toLocaleTimeString()}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px', fontWeight: '500' }}>
            {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          {/* Active Session Status */}
          {status.checkedIn ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div
                className="status-badge success"
                style={{
                  fontSize: '13px',
                  padding: '6px 16px',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
                  marginBottom: '16px'
                }}
              >
                ● Currently Clocked In
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Session Elapsed Time:
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: '28px',
                  fontWeight: '700',
                  color: 'var(--secondary)',
                  marginBottom: '32px'
                }}
              >
                {elapsed || '00:00:00'}
              </div>
              <Button
                variant="danger"
                onClick={handleCheckOut}
                disabled={loading}
                style={{ width: '100%', maxWidth: '280px', height: '48px' }}
              >
                🔴 Clock Out
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '16px' }}>
              <div
                className="status-badge danger"
                style={{
                  fontSize: '13px',
                  padding: '6px 16px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  color: 'var(--danger)',
                  borderColor: 'rgba(244, 63, 94, 0.3)',
                  marginBottom: '16px'
                }}
              >
                ○ Clocked Out
              </div>

              <div className="form-group" style={{ width: '100%', maxWidth: '280px', textAlign: 'left' }}>
                <label>Duty Location Type</label>
                <select value={locationType} onChange={(e) => setLocationType(e.target.value)} disabled={loading}>
                  <option value="Office - Gwalior">Office - Gwalior</option>
                  <option value="Remote - Home">Remote - Home</option>
                  <option value="Client Location">Client Location</option>
                </select>
              </div>

              <div className="form-group" style={{ width: '100%', maxWidth: '280px', textAlign: 'left' }}>
                <label>Clock-In Note</label>
                <input
                  type="text"
                  placeholder="Tasks planned today..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                variant="primary"
                onClick={handleCheckIn}
                disabled={loading}
                style={{ width: '100%', maxWidth: '280px', height: '48px', marginTop: '12px' }}
              >
                🟢 Clock In
              </Button>
            </div>
          )}
        </Card>

        {/* Location Verification Coordinates Widget */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
            🛰️ Simulated Geofencing
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
            To satisfy attendance registries compliance, your connection coordinates are automatically verified:
          </p>

          <div
            style={{
              background: 'rgba(5, 8, 16, 0.4)',
              border: '1px solid var(--border-glass)',
              borderRadius: '10px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '13px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
              <strong style={{ color: 'var(--success)' }}>CONNECTED</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Simulated Latitude:</span>
              <strong>26.2183° N</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Simulated Longitude:</span>
              <strong>78.1828° E</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Range verification:</span>
              <span className="status-badge success" style={{ padding: '2px 8px', fontSize: '10px' }}>WITHIN RANGE</span>
            </div>
          </div>
        </Card>
      </div>

      {/* History log title */}
      <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>
        My Check-in Log History
      </h3>

      {/* Attendance Log Table */}
      <Table
        headers={headers}
        data={logs}
        loading={loading}
        emptyMessage="No check-in entries logged yet."
        renderRow={(log) => (
          <tr key={log.id}>
            <td style={{ fontWeight: '600' }}>
              {new Date(log.check_in_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </td>
            <td>{new Date(log.check_in_time).toLocaleTimeString()}</td>
            <td>
              {log.check_out_time ? (
                new Date(log.check_out_time).toLocaleTimeString()
              ) : (
                <span className="status-badge warning" style={{ fontSize: '10px' }}>Active Session</span>
              )}
            </td>
            <td>📍 {log.location}</td>
            <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {log.notes || '—'}
            </td>
            <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
              {log.worked_hours !== null ? `${log.worked_hours} Hrs` : 'Calculating...'}
            </td>
          </tr>
        )}
      />
    </div>
  );
}
