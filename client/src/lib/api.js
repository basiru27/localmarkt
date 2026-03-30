const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}/api${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(errorData.error || 'Request failed', response.status, errorData.details);
  }

  return response.json();
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
