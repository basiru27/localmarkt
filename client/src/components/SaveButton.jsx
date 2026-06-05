import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSavedIds, useToggleSave } from '../hooks/useSaved';

export default function SaveButton({ listingId, size = 'md', className = '' }) {
  const { user } = useAuth();
  const { data: savedIds = [] } = useSavedIds();
  const { mutate: toggleSave, isPending } = useToggleSave();

  const isSaved = savedIds.includes(listingId);

  if (!user) return null;

  const sizeClasses = size === 'sm'
    ? 'w-11 h-11'
    : 'w-11 h-11';

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isPending) toggleSave({ listingId, isSaved });
      }}
      disabled={isPending}
      aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
      className={`
        flex items-center justify-center rounded-full transition-all
        ${isSaved
          ? 'text-red-500 bg-red-50 hover:bg-red-100'
          : 'text-gray-400 bg-white/80 hover:text-red-400 hover:bg-red-50'
        }
        ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${sizeClasses} ${className}
      `}
    >
      <Heart
        size={size === 'sm' ? 14 : 18}
        className={isSaved ? 'fill-red-500' : ''}
      />
    </button>
  );
}
