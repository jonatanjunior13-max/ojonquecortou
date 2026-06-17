import React from 'react';
import './Badge.css';

const Badge = ({ children, variant = 'default' }) => (
  <span className={`adm-badge adm-badge--${variant}`}>{children}</span>
);

export default Badge;
