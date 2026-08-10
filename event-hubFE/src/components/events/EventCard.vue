<script setup>
import { computed } from 'vue';
import { formatDateTime, formatPrice, highlightOr, truncate } from '@/utils/format.js';

const props = defineProps({
  event: { type: Object, required: true },
});

const title = computed(() => highlightOr(props.event.highlight, 'title', props.event.title));
const snippet = computed(() =>
  highlightOr(props.event.highlight, 'description', truncate(props.event.description))
);
</script>

<template>
  <article class="card event-card">
    <RouterLink
      :to="{ name: 'event-detail', params: { id: event._id } }"
      class="event-card__title"
    >
      <span v-html="title" />
    </RouterLink>

    <div class="event-card__meta">
      <span><i class="pi pi-calendar" /> {{ formatDateTime(event.startsAt) }}</span>
      <span v-if="event.venueName">
        <i class="pi pi-map-marker" /> {{ event.venueName
        }}<template v-if="event.city">, {{ event.city }}</template>
      </span>
    </div>

    <p v-if="snippet" class="event-card__snippet" v-html="snippet" />

    <div class="event-card__footer">
      <div class="row" style="gap: 0.35rem">
        <span v-for="category in event.categories.slice(0, 3)" :key="category" class="chip">
          {{ category }}
        </span>
      </div>
      <span class="price">{{ formatPrice(event.price) }}</span>
    </div>
  </article>
</template>
