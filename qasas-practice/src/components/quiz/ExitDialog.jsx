import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function ExitDialog({ onCancel, onConfirm, restoreFocusTo }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  useFocusTrap(dialogRef, {
    active: true,
    onEscape: onCancel,
    restoreFocusTo,
  });

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div className="exit-dialog-overlay">
      <div
        ref={dialogRef}
        className="exit-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="exit-dialog-title"
        aria-describedby="exit-dialog-description"
      >
        <h2 id="exit-dialog-title">Exit quiz?</h2>
        <p id="exit-dialog-description">Your progress won't be saved.</p>
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
