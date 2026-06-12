import React from 'react';

export default function FormInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  disabled = false,
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
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: error ? '1px solid var(--danger)' : '1px solid var(--border-glass)',
          borderRadius: '10px',
          color: 'var(--text-primary)',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  );
}
