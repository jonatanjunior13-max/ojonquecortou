import React, { useEffect } from 'react';
import './Modal.css';

const Modal = ({ open, onClose, title, children, width = 480 }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div
        className="adm-modal"
        style={{ maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="adm-modal-header">
            <span className="adm-modal-title">{title}</span>
            <button type="button" className="adm-modal-close" onClick={onClose}>✕</button>
          </div>
        )}
        <div className="adm-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
