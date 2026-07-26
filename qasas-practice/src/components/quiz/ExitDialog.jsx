import { useEffect, useRef } from 'react';

export default function ExitDialog({ onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className="exit-dialog-overlay">
      <div className="exit-dialog" role="alertdialog" aria-modal="true">
        <h2>Exit quiz?</h2>
        <p>Your progress won't be saved.</p>
        <div className="exit-dialog-buttons">
          <button ref={cancelRef} className="exit-dialog-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="exit-dialog-btn confirm" onClick={onConfirm}>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
