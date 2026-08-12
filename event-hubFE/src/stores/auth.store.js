import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as authApi from '@/api/auth.api.js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const ready = ref(false);

  let sessionPromise = null;

  const isAuthenticated = computed(() => Boolean(user.value));
  const isOrganizer = computed(() => user.value?.role === 'organizer');

  function apply(session) {
    user.value = session.user;
    ready.value = true;
    sessionPromise = Promise.resolve(session.user);
  }

  function clear() {
    user.value = null;
    ready.value = true;
    sessionPromise = Promise.resolve(null);
  }

  async function loadSession() {
    try {
      const { user: current } = await authApi.me();
      user.value = current;
    } catch {
      user.value = null;
    } finally {
      ready.value = true;
    }
    return user.value;
  }

  function ensureSession() {
    sessionPromise ??= loadSession();
    return sessionPromise;
  }

  async function revalidateSession() {
    sessionPromise = loadSession();
    return sessionPromise;
  }

  async function login(credentials) {
    apply(await authApi.login(credentials));
    return user.value;
  }

  async function register(details) {
    apply(await authApi.register(details));
    return user.value;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
    }
    clear();
  }

  return {
    user,
    ready,
    isAuthenticated,
    isOrganizer,
    ensureSession,
    revalidateSession,
    login,
    register,
    logout,
    clear,
  };
});
