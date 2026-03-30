// Format price in Gambian Dalasi
export function formatPrice(price) {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return 'GMD 0';
  }
  
  return `GMD ${numPrice.toLocaleString('en-GM', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

// Format date relative to now
export function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined,
    });
  }
}

// Truncate text with ellipsis
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + '...';
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (basic Gambian format)
export function isValidPhone(phone) {
  // Gambian phone numbers: +220 XXXXXXX or 220XXXXXXX or just XXXXXXX
  const phoneRegex = /^(\+?220)?[0-9]{7,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Debounce function for search
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Generate placeholder image URL
export function getPlaceholderImage(category = 'general') {
  const colors = {
    Electronics: '3b82f6',
    Clothing: 'ec4899',
    'Food & Produce': '22c55e',
    Furniture: 'f59e0b',
    Vehicles: '6366f1',
    Services: '8b5cf6',
    Agriculture: '84cc16',
    Other: '6b7280',
  };
  
  const color = colors[category] || colors.Other;
  return `https://placehold.co/400x300/${color}/ffffff?text=${encodeURIComponent(category)}`;
}
