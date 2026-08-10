<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';

const props = defineProps({
  error: { type: [Object, String], default: null },
  title: { type: String, default: null },
  severity: { type: String, default: 'error' },
  retryable: { type: Boolean, default: false },
});

defineEmits(['retry']);

const message = computed(() =>
  typeof props.error === 'string' ? props.error : props.error?.message || 'Something went wrong.'
);

const issues = computed(() =>
  Array.isArray(props.error?.details) ? props.error.details : []
);
</script>

<template>
  <div v-if="error" class="banner" :class="`banner--${severity}`" role="alert">
    <i :class="severity === 'error' ? 'pi pi-exclamation-circle' : 'pi pi-info-circle'" />
    <div class="banner__body">
      <p v-if="title" class="banner__title">{{ title }}</p>
      <p style="margin: 0">{{ message }}</p>
      <ul v-if="issues.length">
        <li v-for="issue in issues" :key="issue.path">
          <strong>{{ issue.path }}</strong> — {{ issue.message }}
        </li>
      </ul>
      <slot />
    </div>
    <Button
      v-if="retryable"
      label="Retry"
      size="small"
      severity="secondary"
      outlined
      @click="$emit('retry')"
    />
  </div>
</template>
