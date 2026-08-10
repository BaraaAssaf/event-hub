import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  getToken,
  request,
  setToken,
  setUnauthorizedHandler,
  withId,
} from '@/api/client.js';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  setToken(null);
  setUnauthorizedHandler(null);
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('request', () => {
  it('calls a relative /api URL and skips the auth header when signed out', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { items: [] }));

    await request('/events', { query: { page: 2, city: 'Berlin' } });

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/events?page=2&city=Berlin');
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('omits empty query values instead of sending city=', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, {}));

    await request('/events', { query: { q: 'node', city: '', minPrice: null, page: undefined } });

    expect(global.fetch.mock.calls[0][0]).toBe('/api/events?q=node');
  });

  it('sends the bearer token once one is set', async () => {
    setToken('jwt-123');
    global.fetch.mockResolvedValue(jsonResponse(200, {}));

    await request('/auth/me');

    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-123');
    expect(getToken()).toBe('jwt-123');
  });

  it('turns the error envelope into an ApiError carrying status, code and details', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(409, {
        error: {
          message: 'This event is sold out (venue capacity 2).',
          code: 'CONFLICT',
          details: { capacity: 2, seatsRemaining: 0 },
        },
      })
    );

    const error = await request('/events/1/register', { method: 'POST' }).catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.details.seatsRemaining).toBe(0);
    expect(error.message).toMatch(/sold out/);
  });

  it('exposes zod issues as a path-keyed map', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(400, {
        error: {
          message: 'Validation failed',
          code: 'BAD_REQUEST',
          details: [
            { path: 'email', message: 'Invalid email address' },
            { path: 'password', message: 'Password must be at least 6 characters' },
          ],
        },
      })
    );

    const error = await request('/auth/register', { method: 'POST', body: {} }).catch((e) => e);

    expect(error.fieldErrors).toEqual({
      email: 'Invalid email address',
      password: 'Password must be at least 6 characters',
    });
  });

  it('does not mistake a non-validation details payload for field errors', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(409, {
        error: { message: 'Sold out', code: 'CONFLICT', details: { seatsRemaining: 0 } },
      })
    );

    const error = await request('/events/1/register', { method: 'POST' }).catch((e) => e);

    expect(error.fieldErrors).toEqual({});
  });

  it('fires the unauthorized hook only when a token was actually sent', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    global.fetch.mockResolvedValue(jsonResponse(401, { error: { message: 'Unauthorized' } }));

    await request('/auth/me').catch(() => {});
    expect(onUnauthorized).not.toHaveBeenCalled();

    setToken('expired');
    await request('/auth/me').catch(() => {});
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('reports an unreachable server rather than leaking the fetch failure', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await request('/events').catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.status).toBe(0);
  });

  it('returns null for 204 without trying to parse a body', async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 204, json: () => Promise.reject() });

    await expect(request('/events/1', { method: 'DELETE' })).resolves.toBeNull();
  });
});

describe('withId', () => {
  it('renames the search hit id so components only ever see _id', () => {
    expect(withId({ id: 'abc', title: 'Vue' })).toEqual({ _id: 'abc', title: 'Vue' });
  });

  it('leaves a REST document alone', () => {
    const doc = { _id: 'abc', title: 'Vue' };
    expect(withId(doc)).toBe(doc);
  });
});
