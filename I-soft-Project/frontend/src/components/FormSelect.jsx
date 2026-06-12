import React from 'react';

export default function FormSelect({
  label,
  id,
  value,
  onChange,
  options = [], // [{ value, label }] or string array
  error,
  required = false,
  disabled = false,
  emptyOptionLabel = '-- Select --',
  style = {},
  ...props
}) {
  return (
    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: error ? '1px solid var(--danger)' : '1px solid var(--border-glass)',
          borderRadius: '10px',
          color: 'var(--text-primary)',
          fontSize: '14px',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        {...props}
      >
        {emptyOptionLabel && <option value="">{emptyOptionLabel}</option>}
        {options.map((opt, idx) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={idx} value={val} style={{ background: '#0f172a', color: '#fff' }}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  );
}
