'use client';

import { useEffect, useRef } from 'react';

export function useModalHistory(closeModal) {
  const hashRef = useRef(`#modal-${Math.random().toString(36).substr(2, 9)}`);
  const isClosingRef = useRef(false);

  useEffect(() => {
    // Use hash to add a history entry safely in Next.js without breaking internal router state
    window.location.hash = hashRef.current;

    const handleHashChange = () => {
      if (window.location.hash !== hashRef.current && !isClosingRef.current) {
        isClosingRef.current = true;
        closeModal();
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      // Clean up history if closed manually via 'X' button
      if (!isClosingRef.current && window.location.hash === hashRef.current) {
        isClosingRef.current = true;
        window.history.back();
      }
    };
  }, [closeModal]);
}
