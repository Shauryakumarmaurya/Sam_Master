'use client';

import { useEffect } from 'react';

export function useModalHistory(closeModal) {
  useEffect(() => {
    // When modal opens, push a dummy state to history
    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = (e) => {
      // User pressed the system Back button or swiped back
      closeModal();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If user clicked 'X' to close, the history state is still there.
      // We must clean it up so the next Back button press doesn't do nothing.
      if (window.history.state && window.history.state.modalOpen) {
        window.history.back();
      }
    };
  }, [closeModal]);
}
