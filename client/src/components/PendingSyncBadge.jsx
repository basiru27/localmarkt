import { useOffline } from '../context/OfflineContext';

export default function PendingSyncBadge() {
  const { pendingCount } = useOffline();

  if (pendingCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
      <svg
        className="w-3 h-3 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
      >
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
      <span>{pendingCount} pending</span>
    </div>
  );
}
