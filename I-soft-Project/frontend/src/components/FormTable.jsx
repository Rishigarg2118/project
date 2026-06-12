import React from 'react';

export default function FormTable({
  headers = [],
  items = [],
  onRemove,
  renderRow,
  emptyText = 'No items added yet.'
}) {
  return (
    <div style={{
      width: '100%',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border-glass)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginTop: '8px'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '13px'
      }}>
        <thead>
          <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-glass)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {h}
              </th>
            ))}
            {onRemove && <th style={{ padding: '10px 14px', width: '60px', textAlign: 'right', color: 'var(--text-secondary)' }}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length + (onRemove ? 1 : 0)}
                style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                {renderRow ? (
                  renderRow(item, idx)
                ) : (
                  Object.values(item).map((val, cellIdx) => (
                    <td key={cellIdx} style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>
                      {typeof val === 'string' && val.startsWith('http') ? (
                        <a href={val} target="_blank" rel="noreferrer" style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>
                          View Link
                        </a>
                      ) : (
                        val
                      )}
                    </td>
                  ))
                )}
                {onRemove && (
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '15px'
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
