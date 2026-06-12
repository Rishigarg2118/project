import React from 'react';

export default function Logo({ size = 32, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 4px 12px rgba(234, 88, 12, 0.25))', ...style }}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--secondary)" />
        </linearGradient>
      </defs>
      {/* Outer rotating/dotted track */}
      <circle cx="50" cy="50" r="42" stroke="url(#logoGrad)" strokeWidth="4" strokeDasharray="6 4" opacity="0.4" />
      
      {/* Bold main crescent track */}
      <path
        d="M50 12C29.01 12 12 29.01 12 50C12 70.99 29.01 88 50 88C70.99 88 88 70.99 88 50"
        stroke="url(#logoGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      
      {/* Inner tech core sphere */}
      <circle cx="50" cy="50" r="20" fill="url(#logoGrad)" />
      
      {/* Internal alignment triangle representing structures */}
      <path d="M50 40 L59 56 L41 56 Z" fill="#fff" />
    </svg>
  );
}
