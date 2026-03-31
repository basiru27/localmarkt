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
        console.log(`Request failed with status ${response.status}. Retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
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
        console.log(`Network error. Retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
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
    const query = searchParams.toString();
    return fetchApi(`/listings${query ? `?${query}` : ''}`);
  },

  getById: id => fetchApi(`/listings/${id}`),

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

export { ApiError };
