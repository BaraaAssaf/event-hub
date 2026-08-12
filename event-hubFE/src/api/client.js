
const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(status, { message, code, details } = {}) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'UNKNOWN';
    this.details = details;
  }

  get fieldErrors() {
    if (!Array.isArray(this.details)) return {};
    return this.details.reduce((acc, issue) => ({ ...acc, [issue.path]: issue.message }), {});
  }
}

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function buildQuery(params) {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.append(key, value instanceof Date ? value.toISOString() : String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function request(path, { method = 'GET', body, query, auth = true, signal, handleUnauthorized = true } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
      method,
      signal,
      credentials: 'include',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, {
      message: 'Cannot reach the server. Check that the API is running.',
      code: 'NETWORK_ERROR',
    });
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && auth && handleUnauthorized) {
      unauthorizedHandler?.();
    }
    throw new ApiError(response.status, payload?.error ?? {});
  }

  return payload;
}

export function withId(record) {
  if (!record || record._id) return record;
  const { id, ...rest } = record;
  return { _id: id, ...rest };
}
