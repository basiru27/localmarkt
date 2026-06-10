// Format price in Gambian Dalasi
export function formatPrice(price) {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return 'GMD 0';
  }
  
  return new Intl.NumberFormat('en-GM', {
    style: 'currency',
    currency: 'GMD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numPrice);
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
    `Hi! I'm interested in your listing: "${listingTitle}" on GMarkt.`
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
export function getPlaceholderImage(category = 'Other') {
  const icons = {
    Clothing: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 10a4 4 0 0 1-8 0"/>',
    Electronics: '<polygon stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    'Food & Produce': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 2c1 .5 2 2 2 5"/>',
    Vehicles: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle stroke-linecap="round" stroke-linejoin="round" stroke-width="2" cx="7" cy="17" r="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17h6"/><circle stroke-linecap="round" stroke-linejoin="round" stroke-width="2" cx="17" cy="17" r="2"/>',
    Services: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    Agriculture: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 22l10-10"/>',
    Other: '<circle stroke-linecap="round" stroke-linejoin="round" stroke-width="2" cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 17h.01"/>',
  };
  
  const svgIcon = icons[category] || icons.Other;
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="100%" height="100%" fill="#f0f7f0" />
    <svg x="180" y="130" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#65a30d">
      ${svgIcon}
    </svg>
  </svg>`;
  
  return `data:image/svg+xml,${encodeURIComponent(svgString)}`;
}

export function exportToCSV(data, columns, filename) {
  if (!data || data.length === 0) return;

  const escape = (val) => {
    const str = val == null ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.key];
      return escape(val);
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
