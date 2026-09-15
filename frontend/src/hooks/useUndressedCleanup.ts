import { useEffect, useCallback } from 'react';
import { undressedStore } from '../store/undressedStore';

interface CleanupOptions {
  roomId?: string | null;
  storageKeys?: (string | null | undefined)[];
  onCleaned?: () => void;
}

export const executeZeroFootprintCleanup = (options: CleanupOptions = {}) => {
  const { roomId, storageKeys } = options;

  // 1. Revoke any local Object URLs from memory
  const state = undressedStore.getState();
  ([1, 2, 3] as const).forEach((idx) => {
    const preview = state.slots[idx].previewUrl;
    if (preview && preview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(preview);
      } catch {}
    }
  });

  // 2. Guaranteed server storage wipe via navigator.sendBeacon or fetch with keepalive
  const keysToClean: string[] = [];
  if (storageKeys && storageKeys.length > 0) {
    storageKeys.forEach((k) => {
      if (k) keysToClean.push(k);
    });
  } else {
    ([1, 2, 3] as const).forEach((idx) => {
      const k = state.slots[idx].storageKey;
      if (k) keysToClean.push(k);
    });
  }

  const payload = JSON.stringify({
    roomId: roomId || state.roomId,
    storageKeys: keysToClean
  });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/vault/cleanup', blob);
  } else if (typeof fetch !== 'undefined') {
    fetch('/api/vault/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {});
  }

  // 3. Clear browser media caches if available
  if (typeof window !== 'undefined' && 'caches' in window) {
    window.caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.includes('undressed') || name.includes('vault') || name.includes('media')) {
          window.caches.delete(name);
        }
      });
    }).catch(() => {});
  }

  // 4. Reset local store
  undressedStore.resetSession();
};

export const useUndressedCleanup = (roomId?: string | null) => {
  const performCleanup = useCallback(() => {
    executeZeroFootprintCleanup({ roomId });
  }, [roomId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      performCleanup();
    };

    const handlePageHide = () => {
      performCleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [performCleanup]);

  return {
    cleanup: performCleanup
  };
};
