import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Refresh lock — prevents concurrent refresh race (Supabase rotates refresh tokens)
let refreshPromise = null;

const refreshSession = () => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = supabase.auth.refreshSession().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

const TIMEOUT_MS = 15000;

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
  if (error && (error.name === 'TypeError' || error.name === 'AbortError')) {
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
    signal: options.signal || AbortSignal.timeout(TIMEOUT_MS),
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Already tried refreshing once for this request — give up
        if (retryCount > 0) {
          window.dispatchEvent(new CustomEvent('auth:expired'));
          throw new ApiError('Session expired. Please log in again.', 401);
        }

        // Try to refresh the session before concluding it's expired
        // Uses refreshSession() with a module-level lock to prevent concurrent
        // refresh races (Supabase rotates refresh tokens on each refresh)
        const { data: refreshData, error: refreshError } = await refreshSession();
        if (refreshError || !refreshData?.session) {
          window.dispatchEvent(new CustomEvent('auth:expired'));
          throw new ApiError('Session expired. Please log in again.', 401);
        }
        // Retry the original request with the refreshed token
        const retryOptions = {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${refreshData.session.access_token}`,
          },
        };
        return fetchApi(endpoint, retryOptions, retryCount + 1);
      }

      // 503 = auth service temporarily unavailable (cold start, transient).
      // Retry with backoff instead of immediately failing.
      if (response.status === 503) {
        if (retryCount < RETRY_CONFIG.maxRetries) {
          const retryDelay = getRetryDelay(retryCount);
          await delay(retryDelay);
          return fetchApi(endpoint, options, retryCount + 1);
        }
        throw new ApiError('Authentication service temporarily unavailable. Please try again.', 503);
      }

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
    if (params.area_id) searchParams.append('area_id', params.area_id);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.user_id) searchParams.append('user_id', params.user_id);
    if (params.exclude_user_id) searchParams.append('exclude_user_id', params.exclude_user_id);
    const query = searchParams.toString();
    return fetchApi(`/listings${query ? `?${query}` : ''}`);
  },

  getSuggestions: (q) => fetchApi(`/listings/search/suggestions?q=${encodeURIComponent(q)}`),

  getById: (id, authHeader = {}) =>
    fetchApi(`/listings/${id}`, {
      headers: authHeader,
    }),

  getMine: (params = {}, authHeader) => {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.append('category', params.category);
    if (params.area_id) searchParams.append('area_id', params.area_id);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.is_sold !== undefined) searchParams.append('is_sold', params.is_sold);
    if (params.moderation_status) searchParams.append('moderation_status', params.moderation_status);
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

  markAsSold: (id, is_sold, authHeader) =>
    fetchApi(`/listings/${id}/sold`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({ is_sold }),
    }),

  bump: (id, authHeader) =>
    fetchApi(`/listings/${id}/bump`, {
      method: 'POST',
      headers: authHeader,
    }),

  getMineAnalytics: (range, authHeader) =>
    fetchApi(`/listings/analytics?range=${range}`, {
      headers: authHeader,
    }),
};

// Zones & Areas API
export const zonesApi = {
  getAll: () => fetchApi('/zones'),
  getAreas: (zoneId) => fetchApi(`/zones/${zoneId}/areas`),
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
  getStats: (days, authHeader) => fetchApi(`/admin/stats${days ? `?days=${days}` : ''}`, { headers: authHeader }),

  getUsers: (params = {}, authHeader) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.role) searchParams.append('role', params.role);
    if (params.banned !== undefined) searchParams.append('banned', params.banned);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const query = searchParams.toString();

    return fetchApi(`/admin/users${query ? `?${query}` : ''}`, { headers: authHeader });
  },

  updateBanStatus: (userId, data, authHeader) =>
    fetchApi(`/admin/users/${userId}/ban`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify(data),
    }),

  updateVerifyStatus: (userId, data, authHeader) =>
    fetchApi(`/admin/users/${userId}/verify`, {
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
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
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
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const query = searchParams.toString();

    return fetchApi(`/admin/reports${query ? `?${query}` : ''}`, { headers: authHeader });
  },

  updateReport: (reportId, data, authHeader) =>
    fetchApi(`/admin/reports/${reportId}`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify(data),
    }),

  getLogs: (params = {}, authHeader) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/admin/logs${query ? `?${query}` : ''}`, { headers: authHeader });
  },

  exportUsers: (authHeader) => fetchApi('/admin/users/export', { headers: authHeader }),

  exportListings: (authHeader) => fetchApi('/admin/listings/export', { headers: authHeader }),

  exportReports: (authHeader) => fetchApi('/admin/reports/export', { headers: authHeader }),

  exportLogs: (authHeader) => fetchApi('/admin/logs/export', { headers: authHeader }),
};

export const profileApi = {
  get: (authHeader) => fetchApi('/profile', { headers: authHeader }),
  update: (data, authHeader) =>
    fetchApi('/profile', {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify(data),
    }),
  deleteAvatar: (authHeader) =>
    fetchApi('/profile/avatar', {
      method: 'DELETE',
      headers: authHeader,
    }),
};

export const notificationsApi = {
  getAll: (params = {}, authHeader) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.unread_only !== undefined) searchParams.append('unread_only', params.unread_only);
    const query = searchParams.toString();
    return fetchApi(`/notifications${query ? `?${query}` : ''}`, { headers: authHeader });
  },
  markRead: (id, authHeader) => fetchApi(`/notifications/${id}/read`, {
    method: 'PATCH',
    headers: authHeader
  }),
  markAllRead: (authHeader) => fetchApi('/notifications/read-all', {
    method: 'PATCH',
    headers: authHeader
  }),
  delete: (id, authHeader) => fetchApi(`/notifications/${id}`, {
    method: 'DELETE',
    headers: authHeader
  }),
};

export const savedApi = {
  getAll: (authHeader) =>
    fetchApi('/saved', { headers: authHeader }),

  getIds: (authHeader) =>
    fetchApi('/saved/ids', { headers: authHeader }),

  save: (listingId, authHeader) =>
    fetchApi(`/saved/${listingId}`, {
      method: 'POST',
      headers: authHeader,
    }),

  unsave: (listingId, authHeader) =>
    fetchApi(`/saved/${listingId}`, {
      method: 'DELETE',
      headers: authHeader,
    }),
};

export const authApi = {
  checkEmail: (email) =>
    fetchApi(`/auth/check-email?email=${encodeURIComponent(email)}`),
};

export { ApiError, fetchApi, isRetryable };
