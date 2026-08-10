<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Button from 'primevue/button';

const route = useRoute();
const forbidden = computed(() => route.meta.status === 403);
</script>

<template>
  <div class="card state state--empty" style="padding: 3rem">
    <i :class="forbidden ? 'pi pi-lock' : 'pi pi-compass'" style="font-size: 2rem" />
    <h1>{{ forbidden ? 'You do not have access to that page' : 'Page not found' }}</h1>
    <p class="muted">
      {{
        forbidden
          ? 'That area is for organizers. Sign in with an organizer account to manage events.'
          : 'The page you were looking for does not exist.'
      }}
    </p>
    <RouterLink :to="{ name: 'events' }">
      <Button label="Browse events" icon="pi pi-arrow-left" severity="secondary" outlined />
    </RouterLink>
  </div>
</template>
