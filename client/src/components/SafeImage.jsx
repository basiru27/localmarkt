import React, { useState, useEffect } from 'react';
import { Camera, Smartphone, Shirt, ShoppingBag, Sofa, Car, Wrench, Package } from 'lucide-react';

const CategoryIcon = ({ category, className }) => {
  switch (category) {
    case 'Electronics & Phones': return <Smartphone className={className} />;
    case 'Clothing & Apparel': return <Shirt className={className} />;
    case 'Food & Groceries': return <ShoppingBag className={className} />;
    case 'Home & Furniture': return <Sofa className={className} />;
    case 'Vehicles': return <Car className={className} />;
    case 'Services': return <Wrench className={className} />;
    default: return <Camera className={className} />;
  }
};

const SafeImage = ({ src, alt, className, placeholderClassName, iconClassName, onLoad, category, ...props }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src || error) {
      onLoad?.();
    }
  }, [src, error, onLoad]);

  if (!src || error) {
    return (
      <div className={`bg-orange-50 flex flex-col items-center justify-center ${placeholderClassName || className}`}>
        <CategoryIcon category={category} className={iconClassName || "w-10 h-10 text-orange-200 mb-2"} />
        <span className="text-xs font-medium text-orange-300">No photo yet</span>
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