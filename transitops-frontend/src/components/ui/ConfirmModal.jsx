import React from 'react';

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 1000 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>Confirm Action</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: 'var(--space-4)' }}>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text)' }}>{message}</p>
        </div>
        <div className="modal-actions" style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
