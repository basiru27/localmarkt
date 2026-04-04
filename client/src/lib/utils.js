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

// Strict Gambian phone validation for form input
// Format: +220 XXXXXXX where first digit after +220 is 2-9
export function isValidGambianPhone(phone) {
  const regex = /^\+220\s[2-9]\d{6}$/;
  return regex.test(phone);
}

// Format input as Gambian phone number with masking
// Returns formatted string: "+220 XXXXXXX"
export function formatGambianPhone(input) {
  // Always ensure +220 prefix
  const prefix = '+220 ';
  
  // Extract only digits from input (excluding the +220 prefix)
  let value = input;
  
  // Remove the prefix if present to get just the number part
  if (value.startsWith('+220 ')) {
    value = value.slice(5);
  } else if (value.startsWith('+220')) {
    value = value.slice(4);
  } else if (value.startsWith('+22')) {
    value = value.slice(3);
  } else if (value.startsWith('+2')) {
    value = value.slice(2);
  } else if (value.startsWith('+')) {
    value = value.slice(1);
  }
  
  // Remove any non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 7 digits
  const limitedDigits = digits.slice(0, 7);
  
  // Return formatted number
  return prefix + limitedDigits;
}

// Normalize phone number for WhatsApp (ensure it has country code)
export function normalizePhoneForWhatsApp(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove leading + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  
  // If it starts with 220, it's already got country code
  if (cleaned.startsWith('220')) {
    return cleaned;
  }
  
  // If it's a 7-digit Gambian number, add country code
  if (cleaned.length >= 7 && cleaned.length <= 9) {
    return '220' + cleaned;
  }
  
  // Return as-is for other formats (international numbers)
  return cleaned;
}

// Check if contact looks like a phone number (for showing WhatsApp button)
export function looksLikePhoneNumber(contact) {
  if (!contact) return false;
  // Contains at least 7 consecutive digits
  const digitsOnly = contact.replace(/\D/g, '');
  return digitsOnly.length >= 7;
}

// Generate WhatsApp link
export function getWhatsAppLink(phone, listingTitle) {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  if (!normalizedPhone) return null;
  
  const message = encodeURIComponent(
    `Hi! I'm interested in your listing: "${listingTitle}" on LocalMarkt.`
  );
  return `https://wa.me/${normalizedPhone}?text=${message}`;
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
