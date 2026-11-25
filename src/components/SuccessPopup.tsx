import { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

interface SuccessPopupProps {
  isOpen: boolean;
  title?: string;
  message: string;
  actionLabel?: string;
  onClose: () => void;
}

export default function SuccessPopup({
  isOpen,
  title = 'Success',
  message,
  actionLabel = 'Done',
  onClose,
}: SuccessPopupProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeBtnRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-popup-title"
        aria-describedby="success-popup-desc"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div className="success-icon-wrap" aria-hidden="true">
              <Check size={20} />
            </div>
            <h2 id="success-popup-title" className="modal-title">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close success message"
            style={{ minWidth: '36px', padding: '0.35rem' }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <p id="success-popup-desc" className="modal-message">
          {message}
        </p>

        <div className="modal-actions">
          <button
            ref={closeBtnRef}
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
