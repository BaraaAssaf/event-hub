<script setup>
import ProgressSpinner from 'primevue/progressspinner';
import ErrorBanner from './ErrorBanner.vue';

defineProps({
  loading: { type: Boolean, default: false },
  error: { type: [Object, String], default: null },
  empty: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'Nothing here yet.' },
});

defineEmits(['retry']);
</script>

<template>
  <div v-if="loading" class="state">
    <slot name="loading">
      <ProgressSpinner style="width: 42px; height: 42px" strokeWidth="4" aria-label="Loading" />
    </slot>
  </div>

  <slot v-else-if="error" name="error" :error="error">
    <ErrorBanner :error="error" retryable @retry="$emit('retry')" />
  </slot>

  <slot v-else-if="empty" name="empty">
    <div class="state state--empty">
      <i class="pi pi-inbox" style="font-size: 1.75rem" />
      <p>{{ emptyMessage }}</p>
    </div>
  </slot>

  <slot v-else />
</template>
