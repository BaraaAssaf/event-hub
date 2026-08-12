import { useAuthStore } from '@/stores/auth.store.js';

/**
 * @param {{ fullPath: string, meta?: object }} to
 * @param {{ isAuthenticated: boolean, role?: string }} session
 * @returns {true | import('vue-router').RouteLocationRaw}
 */
export function resolveNavigation(to, session) {
  const { requiresAuth = false, roles = null, guestOnly = false } = to.meta ?? {};

  if (guestOnly && session.isAuthenticated) {
    return { name: 'events' };
  }
  if (requiresAuth && !session.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (roles && !roles.includes(session.role)) {
    return { name: 'forbidden' };
  }
  return true;
}

export function installGuards(router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore();

    if (to.meta?.requiresAuth) {
      await auth.revalidateSession();
    } else {
      await auth.ensureSession();
    }

    return resolveNavigation(to, {
      isAuthenticated: auth.isAuthenticated,
      role: auth.user?.role,
    });
  });
}
