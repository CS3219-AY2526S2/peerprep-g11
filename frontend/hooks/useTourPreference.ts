'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const STORAGE_PREFIX = 'peerprep:tour:';

function getStorageKey(tourId: string): string {
  return `${STORAGE_PREFIX}${tourId}:skipped`;
}

function subscribeToStorage(callback: () => void) {
  const handler = (e: StorageEvent) => {
    callback();
  };
  window.addEventListener('storage', handler);
  window.addEventListener('tour-preference-change', callback);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('tour-preference-change', callback);
  };
}

function getSnapshotFactory(tourId: string) {
  return () => {
    try {
      return localStorage.getItem(getStorageKey(tourId)) === 'true';
    } catch {
      return false;
    }
  };
}

function getServerSnapshot() {
  return false;
}

export interface TourPreference {
  isSkipped: boolean;
  skip: () => void;
  reset: () => void;
}

export function useTourPreference(tourId: string): TourPreference {
  const getSnapshot = useMemo(() => getSnapshotFactory(tourId), [tourId]);

  const isSkipped = useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    getServerSnapshot,
  );

  const skip = useCallback(() => {
    try {
      localStorage.setItem(getStorageKey(tourId), 'true');
      window.dispatchEvent(new Event('tour-preference-change'));
    } catch {
    }
  }, [tourId]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(tourId));
      window.dispatchEvent(new Event('tour-preference-change'));
    } catch {
    }
  }, [tourId]);

  return { isSkipped, skip, reset };
}
