<script setup>
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import { useAuthStore } from '@/stores/auth.store.js';

const auth = useAuthStore();
const router = useRouter();

function signOut() {
  auth.logout();
  router.push({ name: 'events' });
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <RouterLink :to="{ name: 'events' }" class="app-header__brand">
        <i class="pi pi-ticket" style="color: var(--accent)" />
        EventHub
      </RouterLink>

      <nav class="app-header__nav">
        <RouterLink :to="{ name: 'events' }">Events</RouterLink>
        <RouterLink v-if="auth.isAuthenticated && !auth.isOrganizer" :to="{ name: 'my-registrations' }">
          My registrations
        </RouterLink>
        <RouterLink v-if="auth.isOrganizer" :to="{ name: 'organizer' }">My events</RouterLink>
      </nav>

      <div class="app-header__user">
        <template v-if="auth.isAuthenticated">
          <span>{{ auth.user.name }} · {{ auth.user.role }}</span>
          <Button label="Sign out" size="small" severity="secondary" text @click="signOut" />
        </template>
        <template v-else-if="auth.ready">
          <RouterLink :to="{ name: 'login' }">Sign in</RouterLink>
          <RouterLink :to="{ name: 'register' }">
            <Button label="Create account" size="small" />
          </RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>
