import { useOffline } from '../context/OfflineContext';

export default function OfflineBanner() {
  const { isOnline, showCachedDataNotice } = useOffline();

  if (isOnline && !showCachedDataNotice) {
    return null;
  }

  return (
    <div className="offline-banner">
      {!isOnline ? (
        <span>You are offline. Some features may be limited.</span>
      ) : (
        showCachedDataNotice && (
          <span>Reconnected. Refreshing data...</span>
        )
      )}
    </div>
  );
}
