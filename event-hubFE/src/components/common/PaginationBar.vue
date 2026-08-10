<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

const emit = defineEmits(['update:page']);

const hasPages = computed(() => props.totalPages > 1);

function go(delta) {
  const next = props.page + delta;
  if (next >= 1 && next <= props.totalPages) emit('update:page', next);
}
</script>

<template>
  <nav v-if="total > 0" class="pagination" aria-label="Pagination">
    <Button
      v-if="hasPages"
      icon="pi pi-chevron-left"
      label="Previous"
      size="small"
      severity="secondary"
      outlined
      :disabled="page <= 1"
      @click="go(-1)"
    />
    <span>
      <template v-if="hasPages">Page {{ page }} of {{ totalPages }} · </template>
      {{ total }} result{{ total === 1 ? '' : 's' }}
    </span>
    <Button
      v-if="hasPages"
      icon="pi pi-chevron-right"
      iconPos="right"
      label="Next"
      size="small"
      severity="secondary"
      outlined
      :disabled="page >= totalPages"
      @click="go(1)"
    />
  </nav>
</template>
