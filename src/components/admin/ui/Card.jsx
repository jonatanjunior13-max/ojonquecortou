import React from 'react';
import './Card.css';

const Card = ({ children, variant = 'default', className = '', style, onClick }) => (
  <div
    className={`adm-card adm-card--${variant} ${className}`}
    style={style}
    onClick={onClick}
  >
    {children}
  </div>
);

export default Card;
