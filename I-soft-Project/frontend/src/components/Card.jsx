import React from 'react';

export default function Card({ 
  children, 
  style = {}, 
  className = '', 
  hoverable = true,
  onClick
}) {
  return (
    <div
      onClick={onClick}
      className={`glass-card ${className}`}
      style={{
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        transform: 'none',
        ...style
      }}
    >
      {children}
    </div>
  );
}
