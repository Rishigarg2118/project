import React, { useState, useEffect } from 'react';
import useLeave from '../hooks/useLeave';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Loader from '../components/Loader';

export default function LeaveDashboard() {
  const {
    leaves,
    balances,
    loading,
    error,
    fetchMyLeaves,
    fetchMyBalances,
    applyLeave
  } = useLeave();

  // Form fields
  const [leaveType, setLeaveType] = useState('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMyLeaves();
    fetchMyBalances();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!startDate || !endDate || !reason) {
      setFormError('Please fill in all fields.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setFormError('End date must be on or after start date.');
      return;
    }

    try {
      await applyLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason
      });
      setSuccessMsg('Leave request submitted successfully!');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchMyLeaves();
      fetchMyBalances();
    } catch (err) {
      setFormError(err.message || 'Failed to submit leave request');
    }
  };

  const headers = [
    { label: 'Date Submitted' },
    { label: 'Leave Type' },
    { label: 'Duration' },
    { label: 'Reason' },
    { label: 'Status' },
    { label: 'Reviewed By / Notes' }
  ];

  if (loading && !balances) {
    return <Loader message="Fetching leave account details..." />;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <header style={{ marginBottom: '36px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--text-primary) 50%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}
        >
          My Leave Account
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Check your annual leave balances, submit leave applications, and view history.
        </p>
      </header>

      {/* Balance Cards */}
      {balances && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '36px'
          }}
        >
          <Card style={{ borderTop: '4px solid var(--danger)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>SICK LEAVES</div>
            <div style={{ fontSize: '36px', fontWeight: '800', margin: '8px 0', fontFamily: 'var(--font-head)', color: 'var(--danger)' }}>
              {balances.sick_leaves}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Days remaining</span>
          </Card>

          <Card style={{ borderTop: '4px solid var(--secondary)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>CASUAL LEAVES</div>
            <div style={{ fontSize: '36px', fontWeight: '800', margin: '8px 0', fontFamily: 'var(--font-head)', color: 'var(--secondary)' }}>
              {balances.casual_leaves}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Days remaining</span>
          </Card>

          <Card style={{ borderTop: '4px solid var(--success)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>EARNED LEAVES</div>
            <div style={{ fontSize: '36px', fontWeight: '800', margin: '8px 0', fontFamily: 'var(--font-head)', color: 'var(--success)' }}>
              {balances.earned_leaves}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Days remaining</span>
          </Card>
        </div>
      )}

      {/* Main Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '36px' }}>
        {/* Request Form */}
        <Card style={{ height: 'fit-content' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
            Apply for Leave
          </h3>

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {formError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                ⚠️ {formError}
              </div>
            )}
            {successMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                ✅ {successMsg}
              </div>
            )}

            <div className="form-group">
              <label>Leave Category</label>
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="earned">Earned Leave</option>
              </select>
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Reason / Explanation</label>
              <textarea
                placeholder="Briefly explain the reason for leaves..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            <Button type="submit" variant="primary" style={{ height: '44px', marginTop: '8px' }}>
              Submit Leave Request
            </Button>
          </form>
        </Card>

        {/* History Table */}
        <Card style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
            Application History
          </h3>

          <Table
            headers={headers}
            data={leaves}
            emptyMessage="No leave requests logged."
            renderRow={(leave) => {
              const start = new Date(leave.start_date);
              const end = new Date(leave.end_date);
              const duration = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

              return (
                <tr key={leave.id}>
                  <td style={{ fontSize: '13px' }}>{new Date(leave.created_at).toLocaleDateString()}</td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                      {leave.leave_type} Leave
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{duration} Day(s)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {start.toLocaleDateString()} - {end.toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {leave.reason}
                  </td>
                  <td>
                    <span className={`status-badge ${
                      leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {leave.reviewer_name ? (
                      <div>
                        <strong>👤 {leave.reviewer_name}</strong>
                        {leave.review_notes && <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '2px' }}>"{leave.review_notes}"</div>}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Pending review</span>
                    )}
                  </td>
                </tr>
              );
            }}
          />
        </Card>
      </div>
    </div>
  );
}
