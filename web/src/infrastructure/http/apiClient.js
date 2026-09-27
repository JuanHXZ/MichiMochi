import { storageAdapter } from '../storage/storageAdapter';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Cliente HTTP centralizado para llamadas al backend
 */
export async function apiClient(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    requiresAuth = false,
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (requiresAuth) {
    const token = storageAdapter.getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    const error = new Error('No se pudo conectar con el servidor backend (http://localhost:5000). Asegúrate de que el backend esté iniciado.');
    error.isNetworkError = true;
    error.originalError = networkError;
    throw error;
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || (data && data.ok === false)) {
    const errorMessage =
      data?.details?.map((d) => d.message).join(', ') ||
      data?.error ||
      `Error HTTP ${response.status}: ${response.statusText}`;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
