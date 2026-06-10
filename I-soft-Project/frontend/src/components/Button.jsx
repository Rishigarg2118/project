import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  type = 'button', 
  disabled = false, 
  style = {},
  className = '',
  size = 'medium'
}) {
  const getStyles = () => {
    const base = {
      padding: size === 'small' ? '8px 16px' : size === 'large' ? '14px 28px' : '10px 20px',
      fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
      border: 'none',
      borderRadius: '10px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      fontFamily: 'var(--font-body)',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'var(--transition-smooth)',
      ...style
    };

    if (variant === 'primary') {
      return {
        ...base,
        background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
        color: 'var(--white)',
        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)',
      };
    }
    if (variant === 'secondary') {
      return {
        ...base,
        background: 'linear-gradient(135deg, var(--secondary) 0%, #0891b2 100%)',
        color: 'var(--white)',
        boxShadow: '0 4px 14px rgba(6, 182, 212, 0.25)',
      };
    }
    if (variant === 'danger') {
      return {
        ...base,
        background: 'linear-gradient(135deg, var(--danger) 0%, #be123c 100%)',
        color: 'var(--white)',
        boxShadow: '0 4px 14px rgba(244, 63, 94, 0.25)',
      };
    }
    if (variant === 'ghost') {
      return {
        ...base,
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-glass)',
        color: 'var(--text-primary)',
      };
    }
    return base;
  };

  const handleMouseEnter = (e) => {
    if (disabled) return;
    if (variant === 'primary') {
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4), 0 0 12px var(--primary)';
      e.currentTarget.style.transform = 'translateY(-1.5px)';
    } else if (variant === 'secondary') {
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(6, 182, 212, 0.4), 0 0 12px var(--secondary)';
      e.currentTarget.style.transform = 'translateY(-1.5px)';
    } else if (variant === 'danger') {
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(244, 63, 94, 0.4), 0 0 12px var(--danger)';
      e.currentTarget.style.transform = 'translateY(-1.5px)';
    } else {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      e.currentTarget.style.borderColor = 'var(--border-glass-active)';
    }
  };

  const handleMouseLeave = (e) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(0)';
    if (variant === 'primary') {
      e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.25)';
    } else if (variant === 'secondary') {
      e.currentTarget.style.boxShadow = '0 4px 14px rgba(6, 182, 212, 0.25)';
    } else if (variant === 'danger') {
      e.currentTarget.style.boxShadow = '0 4px 14px rgba(244, 63, 94, 0.25)';
    } else {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
      e.currentTarget.style.borderColor = 'var(--border-glass)';
    }
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={getStyles()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </button>
  );
}
