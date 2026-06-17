import React from 'react';
import './Input.css';

const Input = ({ label, id, error, className = '', ...props }) => (
  <div className={`adm-input-wrap ${className}`}>
    {label && <label className="adm-input-label" htmlFor={id}>{label}</label>}
    <input id={id} className={`adm-input ${error ? 'adm-input--error' : ''}`} {...props} />
    {error && <span className="adm-input-error">{error}</span>}
  </div>
);

export default Input;
