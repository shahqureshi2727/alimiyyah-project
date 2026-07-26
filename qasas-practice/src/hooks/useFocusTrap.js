import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap(containerRef, { active, onEscape, restoreFocusTo } = {}) {
  useEffect(() => {
    if (!active) return undefined;

    const previousActiveElement = document.activeElement;
    const restoreTarget = restoreFocusTo?.current || previousActiveElement;
    const container = containerRef.current;
    const focusableElements = () =>
      Array.from(container?.querySelectorAll(FOCUSABLE_SELECTOR) || []).filter(
        (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
      );

    const focusFirst = () => {
      const [first] = focusableElements();
      first?.focus();
    };

    focusFirst();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const elements = focusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (restoreTarget && typeof restoreTarget.focus === 'function') {
        restoreTarget.focus();
      }
    };
  }, [active, containerRef, onEscape, restoreFocusTo]);
}
