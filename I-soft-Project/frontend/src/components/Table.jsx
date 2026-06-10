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
              <td colSpan={headers.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                {emptyMessage}
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
