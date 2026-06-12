import React from 'react';

export default function Logo({ size = 32, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 6px 18px rgba(234, 88, 12, 0.3))',
        ...style
      }}
    >
      <defs>
        <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff7e40" />
          <stop offset="60%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="innerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffedd5" />
        </linearGradient>
        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Hexagonal Tech Shield Base */}
      <path
        d="M50 8L86 28V68L50 88L14 68V28L50 8Z"
        fill="url(#primaryGrad)"
        opacity="0.08"
        stroke="url(#primaryGrad)"
        strokeWidth="2"
      />

      {/* Outer Rotating Gear Ring */}
      <circle
        cx="50"
        cy="50"
        r="38"
        stroke="url(#accentGrad)"
        strokeWidth="2.5"
        strokeDasharray="8 6"
        opacity="0.65"
      />

      {/* Sleek Overlapping Dynamic Swishes (Tech Loops) */}
      <path
        d="M50 15C30.67 15 15 30.67 15 50C15 57.5 17.5 64.5 22 70"
        stroke="url(#primaryGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        filter="url(#glowEffect)"
      />
      <path
        d="M50 85C69.33 85 85 69.33 85 50C85 42.5 82.5 35.5 78 30"
        stroke="url(#accentGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        filter="url(#glowEffect)"
      />

      {/* Central Integrated Core Badge */}
      <circle
        cx="50"
        cy="50"
        r="22"
        fill="url(#primaryGrad)"
        stroke="#ffffff"
        strokeWidth="3"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(234, 88, 12, 0.4))' }}
      />

      {/* Modern abstract interlocking monogram inside the core */}
      <path
        d="M43 43H57V48H49V51H55V55H49V59H57"
        stroke="url(#innerGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Floating Spark Nodes */}
      <circle cx="50" cy="21" r="4" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 5px #ffffff)' }} />
      <circle cx="50" cy="79" r="4" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 5px #ffffff)' }} />
    </svg>
  );
}
