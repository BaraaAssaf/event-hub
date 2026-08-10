import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as authApi from '@/api/auth.api.js';
import { getToken, setToken } from '@/api/client.js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(getToken());
  const ready = ref(false);

  let sessionPromise = null;

  const isAuthenticated = computed(() => Boolean(user.value));
  const isOrganizer = computed(() => user.value?.role === 'organizer');

  function apply(session) {
    user.value = session.user;
    token.value = session.token;
    setToken(session.token);
    ready.value = true;
    sessionPromise = Promise.resolve(session.user);
  }

  function clear() {
    user.value = null;
    token.value = null;
    setToken(null);
    ready.value = true;
    sessionPromise = Promise.resolve(null);
  }

  async function loadSession() {
    if (!token.value) {
      ready.value = true;
      return null;
    }
    try {
      const { user: current } = await authApi.me();
      user.value = current;
    } catch {
      user.value = null;
      token.value = null;
      setToken(null);
    } finally {
      ready.value = true;
    }
    return user.value;
  }

  function ensureSession() {
    sessionPromise ??= loadSession();
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

  function logout() {
    clear();
  }

  return {
    user,
    token,
    ready,
    isAuthenticated,
    isOrganizer,
    ensureSession,
    login,
    register,
    logout,
    clear,
  };
});
