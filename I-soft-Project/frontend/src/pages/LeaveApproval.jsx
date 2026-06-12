import React, { useState, useEffect } from 'react';
import useLeave from '../hooks/useLeave';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import axios from 'axios';

// Audit Trail Timeline Component
function AuditTimeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>
        No approval history recorded yet.
      </div>
    );
  }

  const actionColor = (action) => {
    if (action === 'approved') return 'var(--success)';
    if (action === 'rejected') return 'var(--danger)';
    return 'var(--warning)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {history.map((item, idx) => (
        <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {/* Timeline track */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '20px' }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: actionColor(item.action),
              border: `2px solid ${actionColor(item.action)}44`,
              boxShadow: `0 0 6px ${actionColor(item.action)}66`,
              flexShrink: 0,
              marginTop: '3px',
            }} />
            {idx < history.length - 1 && (
              <div style={{ width: '2px', flex: '1', background: 'var(--border-glass)', minHeight: '24px' }} />
            )}
          </div>
          {/* Content */}
          <div style={{ paddingBottom: '16px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '700', fontSize: '13px', textTransform: 'capitalize', color: actionColor(item.action) }}>
                {item.action}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                by <strong style={{ color: 'var(--text-primary)' }}>{item.reviewer_name}</strong>
                {' '}({item.reviewer_role})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {new Date(item.created_at).toLocaleString()}
              </span>
            </div>
            {item.remarks && (
              <div style={{
                marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)',
                fontStyle: 'italic', background: 'rgba(255,255,255,0.03)',
                borderLeft: `3px solid ${actionColor(item.action)}66`,
                padding: '4px 8px', borderRadius: '0 4px 4px 0'
              }}>
                "{item.remarks}"
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LeaveApproval() {
  const { fetchLeaveQueue, reviewLeave, loading, error } = useLeave();

  const [queue, setQueue]                       = useState([]);
  const [selectedLeave, setSelectedLeave]       = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen]       = useState(false);
  const [auditHistory, setAuditHistory]         = useState([]);
  const [historyLoading, setHistoryLoading]     = useState(false);

  const [status, setStatus]         = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const data = await fetchLeaveQueue();
      setQueue(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenReview = (leave, actionStatus) => {
    setSelectedLeave(leave);
    setStatus(actionStatus);
    setReviewNotes('');
    setActionError('');
    setIsReviewModalOpen(true);
  };

  const handleViewAuditTrail = async (leave) => {
    setSelectedLeave(leave);
    setAuditHistory([]);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      // Use inline audit_trail from queue (already fetched via JOIN) if available
      if (Array.isArray(leave.audit_trail) && leave.audit_trail.length > 0) {
        setAuditHistory(leave.audit_trail);
      } else {
        const res = await axios.get(`/api/leaves/history/${leave.id}`);
        setAuditHistory(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to load audit trail', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await reviewLeave(selectedLeave.id, { status, review_notes: reviewNotes });
      setIsReviewModalOpen(false);
      loadQueue();
    } catch (err) {
      setActionError(err.message || 'Failed to update leave application status.');
    }
  };

  const headers = [
    { label: 'Employee' },
    { label: 'Leave Type' },
    { label: 'Duration' },
    { label: 'Reason' },
    { label: 'Status' },
    { label: 'Actions', style: { textAlign: 'right' } }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <header style={{ marginBottom: '36px' }}>
        <h1 style={{
          fontFamily: 'var(--font-head)', fontSize: '32px', fontWeight: '800',
          background: 'linear-gradient(135deg, var(--text-primary) 50%, var(--text-secondary) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px'
        }}>
          Leave Applications Review
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Approve or reject employee leave applications. Every action is logged to the audit trail.
        </p>
      </header>

      {error && (
        <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--danger)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          ⚠️ {error}
        </div>
      )}

      <Table
        headers={headers}
        data={queue}
        loading={loading && queue.length === 0}
        emptyMessage="No leave applications in queue."
        renderRow={(leave) => {
          const start    = new Date(leave.start_date);
          const end      = new Date(leave.end_date);
          const duration = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
          const hasHistory = Array.isArray(leave.audit_trail) && leave.audit_trail.length > 0;

          return (
            <tr key={leave.id}>
              <td>
                <div style={{ fontWeight: '600' }}>{leave.employee_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {leave.employee_email} • {leave.designation}
                </div>
                {leave.department_name && (
                  <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px' }}>
                    🏢 {leave.department_name}
                  </div>
                )}
              </td>
              <td style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                {leave.leave_type} Leave
              </td>
              <td>
                <div style={{ fontWeight: '600' }}>{duration} Day(s)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {start.toLocaleDateString()} – {end.toLocaleDateString()}
                </div>
              </td>
              <td style={{ fontSize: '13px', maxWidth: '220px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                "{leave.reason}"
              </td>
              <td>
                <span className={`status-badge ${leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}`}>
                  {leave.status}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {/* Audit trail button always available */}
                  <Button size="small" variant="ghost" onClick={() => handleViewAuditTrail(leave)}
                    style={{ fontSize: '11px', padding: '4px 10px', opacity: hasHistory ? 1 : 0.5 }}>
                    📋 History{hasHistory ? ` (${leave.audit_trail.length})` : ''}
                  </Button>
                  {leave.status === 'pending' ? (
                    <>
                      <Button size="small" variant="secondary" onClick={() => handleOpenReview(leave, 'approved')}>
                        ✅ Approve
                      </Button>
                      <Button size="small" variant="danger" onClick={() => handleOpenReview(leave, 'rejected')}>
                        ❌ Reject
                      </Button>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center' }}>
                      Reviewed
                    </span>
                  )}
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* ── Review Modal ────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Review Leave: ${selectedLeave?.employee_name}`}
        footer={null}
      >
        <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {actionError && (
            <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--danger)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
              ⚠️ {actionError}
            </div>
          )}

          <div style={{ fontSize: '14px', lineHeight: '1.7', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
            <div><strong>Employee:</strong> {selectedLeave?.employee_name} ({selectedLeave?.designation})</div>
            <div><strong>Department:</strong> {selectedLeave?.department_name || 'N/A'}</div>
            <div><strong>Category:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedLeave?.leave_type} Leave</span></div>
            <div><strong>Reason:</strong> "{selectedLeave?.reason}"</div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

          <div className="form-group">
            <label>Review Decision</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="approved">✅ Approve Application</option>
              <option value="rejected">❌ Reject Application</option>
            </select>
          </div>

          <div className="form-group">
            <label>Remarks / Comments (for audit log)</label>
            <textarea
              placeholder="Write remarks that will be saved to the approval audit trail..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button variant="ghost" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant={status === 'approved' ? 'secondary' : 'danger'}>
              Submit Decision
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Audit Trail Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Approval Audit Trail — ${selectedLeave?.employee_name}`}
        footer={null}
      >
        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-glass)', fontSize: '13px', lineHeight: '1.6' }}>
          <div><strong>Leave Type:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedLeave?.leave_type} Leave</span></div>
          <div><strong>Duration:</strong> {selectedLeave?.start_date} → {selectedLeave?.end_date}</div>
          <div>
            <strong>Current Status:</strong>{' '}
            <span className={`status-badge ${selectedLeave?.status === 'approved' ? 'success' : selectedLeave?.status === 'rejected' ? 'danger' : 'warning'}`}>
              {selectedLeave?.status}
            </span>
          </div>
        </div>

        {historyLoading ? (
          <Loader message="Loading audit trail..." />
        ) : (
          <>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              📋 Approval History Log
            </h4>
            <AuditTimeline history={auditHistory} />
          </>
        )}
      </Modal>
    </div>
  );
}
