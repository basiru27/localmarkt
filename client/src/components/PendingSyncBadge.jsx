import { useOffline } from '../context/OfflineContext';

export default function PendingSyncBadge() {
  const { pendingCount, isOnline } = useOffline();

  if (pendingCount === 0) {
    return null;
  }

  return (
    <div className="badge-warning flex items-center gap-1.5 animate-pulse">
      {isOnline ? (
        // Syncing animation
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        // Waiting icon
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span>
        {pendingCount} pending
      </span>
    </div>
  );
}
