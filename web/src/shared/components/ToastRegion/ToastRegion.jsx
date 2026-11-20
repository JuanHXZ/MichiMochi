import React, { useEffect, useRef } from 'react';
import { useToastStore } from '@shared/stores/toastStore';
import './ToastRegion.css';

function ToastItem({ toast, onDismiss, index }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const el = popoverRef.current;
    if (!el) return;

    if (typeof el.showPopover === 'function') {
      try {
        if (!el.matches(':popover-open')) {
          el.showPopover();
        }
      } catch {
        // Fallback when popover API is unavailable or already open
      }
    }

    return () => {
      if (typeof el.hidePopover === 'function') {
        try {
          if (el.matches(':popover-open')) {
            el.hidePopover();
          }
        } catch {
          // Ignore already hidden popover
        }
      }
    };
  }, []);

  const handleClose = () => {
    const el = popoverRef.current;
    const stack = el?.parentElement;
    const wasFocusedInside = el && document.activeElement && el.contains(document.activeElement);

    onDismiss(toast.id);

    if (wasFocusedInside && stack) {
      requestAnimationFrame(() => {
        const nextCloseBtn = stack.querySelector('.toast-card__close');
        if (nextCloseBtn instanceof HTMLElement) {
          nextCloseBtn.focus();
        }
      });
    }
  };

  return (
    <div
      ref={popoverRef}
      id={toast.id}
      popover="manual"
      className={`toast-card toast-card--${toast.type}`}
      style={{ '--toast-index': index }}
    >
      <span className="toast-card__message">{toast.message}</span>
      <button
        type="button"
        className="toast-card__close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastRegion() {
  const toasts = useToastStore((state) => state.toasts);
  const announcement = useToastStore((state) => state.announcement);
  const dismissToast = useToastStore((state) => state.dismissToast);

  return (
    <div className="toast-region" role="region" aria-label="Notifications">
      <p className="visually-hidden">Screen reader announcements</p>
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}
