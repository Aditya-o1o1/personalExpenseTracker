const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'spendwise.accessToken';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function apiRequest(path, { method = 'GET', body, token = tokenStore.get(), ...options } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (response.status === 401 && token) {
    tokenStore.clear();
    window.dispatchEvent(new Event('spendwise:unauthorized'));
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validationDetails = payload.errors
      ?.map(({ field, message }) => `${field}: ${message}`)
      .join('; ');
    const message = validationDetails
      ? `${payload.message || 'Validation failed'}: ${validationDetails}`
      : payload.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.details = payload.errors;
    throw error;
  }

  return payload;
}

export const queryString = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) search.set(key, value);
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
};
