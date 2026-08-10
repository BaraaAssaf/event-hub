import { describe, expect, it } from 'vitest';
import { resolveNavigation } from '@/router/guards.js';
import { routes } from '@/router/index.js';

const anonymous = { isAuthenticated: false, role: undefined };
const attendee = { isAuthenticated: true, role: 'attendee' };
const organizer = { isAuthenticated: true, role: 'organizer' };

const to = (meta, fullPath = '/somewhere') => ({ fullPath, meta });

describe('resolveNavigation', () => {
  it('lets anyone through a public route', () => {
    expect(resolveNavigation(to({}), anonymous)).toBe(true);
    expect(resolveNavigation(to(undefined), attendee)).toBe(true);
  });

  it('sends an anonymous visitor to login and remembers where they were going', () => {
    const result = resolveNavigation(to({ requiresAuth: true }, '/my/registrations'), anonymous);
    expect(result).toEqual({ name: 'login', query: { redirect: '/my/registrations' } });
  });

  it('keeps a signed-in user off the login and register pages', () => {
    expect(resolveNavigation(to({ guestOnly: true }), attendee)).toEqual({ name: 'events' });
    expect(resolveNavigation(to({ guestOnly: true }), anonymous)).toBe(true);
  });

  it('rejects an attendee from an organizer-only route', () => {
    const meta = { requiresAuth: true, roles: ['organizer'] };
    expect(resolveNavigation(to(meta), attendee)).toEqual({ name: 'forbidden' });
    expect(resolveNavigation(to(meta), organizer)).toBe(true);
  });

  it('asks an anonymous visitor to sign in before it mentions roles', () => {
    const meta = { requiresAuth: true, roles: ['organizer'] };
    expect(resolveNavigation(to(meta, '/organizer'), anonymous)).toEqual({
      name: 'login',
      query: { redirect: '/organizer' },
    });
  });
});

describe('route table', () => {
  const byName = Object.fromEntries(routes.map((route) => [route.name, route]));

  it('protects every organizer screen with both auth and the role', () => {
    for (const name of ['organizer', 'event-create', 'event-edit']) {
      expect(byName[name].meta).toMatchObject({ requiresAuth: true, roles: ['organizer'] });
    }
  });

  it('leaves browsing and event detail public', () => {
    expect(byName.events.meta?.requiresAuth).toBeFalsy();
    expect(byName['event-detail'].meta?.requiresAuth).toBeFalsy();
  });

  it('requires auth for my registrations', () => {
    expect(byName['my-registrations'].meta).toMatchObject({ requiresAuth: true });
  });
});
