import React from 'react';

export default function Table({
  headers = [],
  data = [],
  renderRow,
  loading = false,
  emptyMessage = 'No records found'
}) {
  return (
    <div className="glass-table-container">
      <table className="glass-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={h.style || {}} className={h.className || ''}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={headers.length} style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <div style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading records...</div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  maxWidth: '360px',
                  margin: '0 auto',
                  animation: 'fadeIn 0.4s ease-out'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--primary-glow)',
                    border: '1.5px dashed rgba(234, 88, 12, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'var(--primary)',
                    marginBottom: '8px'
                  }}>
                    📭
                  </div>
                  <h4 style={{
                    fontFamily: 'var(--font-head)',
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    No Records Found
                  </h4>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {emptyMessage}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, index) => renderRow(row, index))
          )}
        </tbody>
      </table>
    </div>
  );
}
