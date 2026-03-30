import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getPendingCount } from '../lib/offlineStorage';

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [showCachedDataNotice, setShowCachedDataNotice] = useState(false);

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowCachedDataNotice(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowCachedDataNotice(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();

    // Refresh when coming back online
    const handleOnline = () => {
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refreshPendingCount]);

  // Listen for sync completion from service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event) => {
        if (event.data?.type === 'SYNC_COMPLETE') {
          refreshPendingCount();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, [refreshPendingCount]);

  const value = {
    isOnline,
    pendingCount,
    showCachedDataNotice,
    setShowCachedDataNotice,
    refreshPendingCount,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
