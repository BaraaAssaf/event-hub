<script setup>
import AppHeader from '@/components/layout/AppHeader.vue';
</script>

<template>
  <AppHeader />
  <main class="app-main">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.fullPath.split('?')[0]" />
    </RouterView>
  </main>
  <footer class="app-footer">
    <span>EventHub</span>
    <a href="/api/docs" target="_blank" rel="noopener">API docs</a>
  </footer>
</template>
