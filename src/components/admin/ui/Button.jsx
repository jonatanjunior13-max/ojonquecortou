import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', size = 'md', onClick, type = 'button', disabled, className = '' }) => (
  <button
    type={type}
    className={`adm-btn adm-btn--${variant} adm-btn--${size} ${className}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export default Button;
