import React from 'react';
import './Select.css';

const Select = ({ label, id, children, className = '', ...props }) => (
  <div className={`adm-select-wrap ${className}`}>
    {label && <label className="adm-input-label" htmlFor={id}>{label}</label>}
    <select id={id} className="adm-select" {...props}>{children}</select>
  </div>
);

export default Select;
