const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Delay helper with exponential backoff
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getRetryDelay = (attempt) => {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelay);
};

// Check if error is retryable
const isRetryable = (error, status) => {
  // Network errors are retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  // Check status codes
  return RETRY_CONFIG.retryableStatuses.includes(status);
};

async function fetchApi(endpoint, options = {}, retryCount = 0) {
  const url = `${API_BASE_URL}/api${endpoint}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      
      // Check if we should retry
      if (retryCount < RETRY_CONFIG.maxRetries && isRetryable(null, response.status)) {
        const retryDelay = getRetryDelay(retryCount);
        await delay(retryDelay);
        return fetchApi(endpoint, options, retryCount + 1);
      }

      throw new ApiError(errorData.error || 'Request failed', response.status, errorData.details);
    }

    // If the response is a 204 No Content, don't try to parse JSON
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    // Handle network errors with retry
    if (error.name === 'TypeError' || error.name === 'NetworkError') {
      if (retryCount < RETRY_CONFIG.maxRetries) {
        const retryDelay = getRetryDelay(retryCount);
        await delay(retryDelay);
        return fetchApi(endpoint, options, retryCount + 1);
      }
      throw new ApiError('Network error. Please check your connection.', 0);
    }

    // Re-throw ApiErrors
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap other errors
    throw new ApiError(error.message || 'An unexpected error occurred', 0);
  }
}

// Listings API
export const listingsApi = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.append('category', params.category);
    if (params.region) searchParams.append('region', params.region);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.user_id) searchParams.append('user_id', params.user_id);
    const query = searchParams.toString();
    return fetchApi(`/listings${query ? `?${query}` : ''}`);
  },

  getById: (id, authHeader = {}) =>
    fetchApi(`/listings/${id}`, {
      headers: authHeader,
    }),

  getMine: (params = {}, authHeader) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const query = searchParams.toString();

    return fetchApi(`/listings/mine${query ? `?${query}` : ''}`, {
      headers: authHeader,
    });
  },

  create: (data, authHeader) =>
    fetchApi('/listings', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(data),
    }),

  update: (id, data, authHeader) =>
    fetchApi(`/listings/${id}`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify(data),
    }),

  delete: (id, authHeader) =>
    fetchApi(`/listings/${id}`, {
      method: 'DELETE',
      headers: authHeader,
    }),
};

// Regions API
export const regionsApi = {
  getAll: () => fetchApi('/regions'),
};

// Categories API
export const categoriesApi = {
  getAll: () => fetchApi('/categories'),
};

// Reviews API
export const reviewsApi = {
  getByListingId: (listingId, authHeader = {}) =>
    fetchApi(`/listings/${listingId}/reviews`, {
      headers: authHeader,
    }),

  create: (listingId, data, authHeader) =>
    fetchApi(`/listings/${listingId}/reviews`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(data),
    }),

  update: (reviewId, data, authHeader) =>
    fetchApi(`/reviews/${reviewId}`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify(data),
    }),

  delete: (reviewId, authHeader) =>
    fetchApi(`/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: authHeader,
    }),
};

// Reports API
export const reportsApi = {
  create: (data, authHeader) =>
    fetchApi('/reports', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(data),
    }),
};

// Admin API
export const adminApi = {
  getStats: (authHeader) => fetchApi('/admin/stats', { headers: authHeader }),

  getUsers: (params = {}, authHeader) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.role) searchParams.append('role', params.role);
    if (params.banned !== undefined) searchParams.append('banned', params.banned);
    const query = searchParams.toString();

    return fetchApi(`/admin/users${query ? `?${query}` : ''}`, { headers: authHeader });
  },

  updateBanStatus: (userId, data, authHeader) =>
    fetchApi(`/admin/users/${userId}/ban`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify(data),
    }),

  hardDeleteUser: (userId, authHeader) =>
    fetchApi(`/admin/users/${userId}`, {
      method: 'DELETE',
      headers: authHeader,
    }),

  getListings: (params = {}, authHeader) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    const query = searchParams.toString();

    return fetchApi(`/admin/listings${query ? `?${query}` : ''}`, { headers: authHeader });
  },

  moderateListing: (listingId, data, authHeader) =>
    fetchApi(`/admin/listings/${listingId}/moderate`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify(data),
    }),

  deleteListing: (listingId, authHeader) =>
    fetchApi(`/admin/listings/${listingId}`, {
      method: 'DELETE',
      headers: authHeader,
    }),

  getReports: (params = {}, authHeader) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    const query = searchParams.toString();

    return fetchApi(`/admin/reports${query ? `?${query}` : ''}`, { headers: authHeader });
  },

  updateReport: (reportId, data, authHeader) =>
    fetchApi(`/admin/reports/${reportId}`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify(data),
    }),

  getLogs: (authHeader) => fetchApi('/admin/logs', { headers: authHeader }),
};

export { ApiError };
