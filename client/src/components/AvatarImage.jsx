import { useState } from 'react';

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

const colors = [
  'bg-[#C8622A]',
  'bg-[#E8A838]',
  'bg-[#2D7A4F]',
  'bg-[#5C3317]',
  'bg-[#9A4E2A]',
  'bg-[#1A6B5A]',
  'bg-[#A0522D]',
  'bg-[#6B4E31]',
];

const AvatarImage = ({ src, name, size = 'md', className = '' }) => {
  const [error, setError] = useState(false);

  const sizeClass = sizes[size] || sizes.md;

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const colorIndex = name
    ? Math.abs(name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length
    : 0;
  const colorClass = colors[colorIndex];

  if (!src || error) {
    return (
      <div className={`${sizeClass} ${colorClass} text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'User avatar'}
      className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      onError={() => setError(true)}
    />
  );
};

export default AvatarImage;
