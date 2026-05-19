import React, { useState, useEffect } from 'react';

const CameraIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SafeImage = ({ src, alt, className, placeholderClassName, iconClassName, onLoad, ...props }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src || error) {
      onLoad?.();
    }
  });

  if (!src || error) {
    return (
      <div className={`bg-gradient-to-br from-[#F5EFE8] to-[#E8D5C0] flex items-center justify-center ${placeholderClassName || className}`}>
        <CameraIcon className={iconClassName || "w-6 h-6 text-[#C8622A]/40"} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      onLoad={onLoad}
      {...props}
    />
  );
};

export default SafeImage;