import React, { useEffect } from 'react';
import Button from './Button';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium', // small, medium, large
  style = {}
}) {
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalWidth = size === 'small' ? '400px' : size === 'large' ? '800px' : '600px';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out forwards'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid var(--border-glass-active)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-premium)',
          width: '100%',
          maxWidth: modalWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          ...style
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '20px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            color: 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer !== null && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              background: 'rgba(11, 15, 25, 0.4)'
            }}
          >
            {footer || (
              <>
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
