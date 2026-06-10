// ── Btn ──────────────────────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', onClick, style = {}, small }) {
  const base = {
    padding: small ? '6px 14px' : '10px 20px',
    fontSize: small ? 12 : 14,
    fontWeight: 600,
    letterSpacing: '0.02em',
    ...style,
  }
  const variants = {
    primary:   { background: 'var(--accent)',  color: '#fff' },
    secondary: { background: 'var(--accent2)', color: '#fff' },
    danger:    { background: 'var(--accent3)', color: '#fff' },
    ghost:     { background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--text)' },
  }
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick}>
      {children}
    </button>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1.5px solid var(--border)',
      borderRadius: 14,
      padding: 22,
      boxShadow: 'var(--shadow)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ children, color = 'var(--accent)' }) {
  return (
    <span style={{
      background: color + '20',
      color,
      border: `1px solid ${color}40`,
      borderRadius: 20,
      padding: '3px 11px',
      fontSize: 12,
      fontWeight: 600,
    }}>
      {children}
    </span>
  )
}
