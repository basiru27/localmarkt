import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getPendingCount, getPendingListings, removePendingListing } from '../lib/offlineStorage';
import { listingsApi } from '../lib/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [showCachedDataNotice, setShowCachedDataNotice] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isInitialized = useRef(false);
  
  // Inject context dependencies safely
  const { getAuthHeader } = useAuth();
  const { success, error: showError, info } = useToast();

  // Update pending count
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
      return count;
    } catch (error) {
      console.error('Failed to get pending count:', error);
      return 0;
    }
  }, []);

  // Process offline queue when online
  const processOfflineQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      const pendingListings = await getPendingListings();
      
      if (pendingListings.length === 0) return;
      
      setIsSyncing(true);
      info(`Syncing ${pendingListings.length} pending items...`);

      // Ensure we have a fresh token before syncing
      const authHeader = await getAuthHeader();
      
      let successCount = 0;
      for (const listing of pendingListings) {
        try {
          // Remove the internal offline metadata before sending
          const { pendingId, createdAt, ...apiData } = listing;
          
          await listingsApi.create(apiData, authHeader);
          await removePendingListing(pendingId);
          successCount++;
        } catch (err) {
          console.error(`Failed to sync listing ${listing.pendingId}:`, err);
        }
      }

      await refreshPendingCount();
      
      if (successCount > 0) {
        success(`Successfully synced ${successCount} offline item${successCount !== 1 ? 's' : ''}!`);
      }
      
      if (successCount < pendingListings.length) {
        showError(`Failed to sync ${pendingListings.length - successCount} items. Will retry later.`);
      }
      
    } catch (error) {
      console.error('Error during offline sync:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [getAuthHeader, isSyncing, refreshPendingCount, success, showError, info]);

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowCachedDataNotice(false);
      processOfflineQueue();
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
  }, [processOfflineQueue]);

  // Initial load and online status listener
  useEffect(() => {
    // Initial load
    if (!isInitialized.current) {
      isInitialized.current = true;
      refreshPendingCount().then((count) => {
        if (count > 0 && navigator.onLine) {
          processOfflineQueue();
        }
      }).catch(console.error);
    }
  }, [refreshPendingCount, processOfflineQueue]);

  // Listen for sync completion from service worker (fallback)
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
    isSyncing,
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
