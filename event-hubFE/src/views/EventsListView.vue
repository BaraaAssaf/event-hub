<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AsyncState from '@/components/common/AsyncState.vue';
import ErrorBanner from '@/components/common/ErrorBanner.vue';
import PaginationBar from '@/components/common/PaginationBar.vue';
import EventCard from '@/components/events/EventCard.vue';
import EventFilters from '@/components/events/EventFilters.vue';
import { useAsync } from '@/composables/useAsync.js';
import { useQuerySync } from '@/composables/useQuerySync.js';
import * as eventsApi from '@/api/events.api.js';
import * as venuesApi from '@/api/venues.api.js';

const route = useRoute();

const toInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const { filters, reset, appliedParams } = useQuerySync({
  q: { default: '', debounce: true },
  city: { default: '' },
  category: { default: '' },
  from: { default: null },
  to: { default: null },
  minPrice: { default: null, parse: toNumber },
  maxPrice: { default: null, parse: toNumber },
  sort: { default: 'relevance' },
  page: { default: 1, parse: toInt },
});

const filtersProxy = computed({
  get: () => filters,
  set: (next) => Object.assign(filters, next),
});

const searchDown = ref(false);

const {
  data: results,
  error,
  loading,
  run,
} = useAsync(fetchPage, { initialData: { items: [], page: 1, total: 0, totalPages: 0 } });


async function fetchPage(params) {
  try {
    const page = await eventsApi.searchEvents(params);
    searchDown.value = false;
    return page;
  } catch (err) {
    if (err.status !== 503) throw err;
    searchDown.value = true;
    return eventsApi.listEvents({ city: params.city, page: params.page, upcoming: 'true' });
  }
}

watch(appliedParams, (params) => run(params), { immediate: true });


const cities = ref([]);
const categories = ref([]);

onMounted(async () => {
  const page = await venuesApi.listVenues({ limit: 100 }).catch(() => null);
  if (page) cities.value = [...new Set(page.items.map((venue) => venue.city))].sort();
});

watch(results, (page) => {
  const seen = new Set([...categories.value, ...(page?.items ?? []).flatMap((i) => i.categories)]);
  if (filters.category) seen.add(filters.category);
  categories.value = [...seen].sort();
});

const items = computed(() => results.value?.items ?? []);
const isEmpty = computed(() => !loading.value && items.value.length === 0);
const filtered = computed(() => Object.keys(route.query).length > 0);
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Events</h1>
        <p class="muted" style="margin: 0">Find something to go to, then take a seat.</p>
      </div>
    </div>

    <EventFilters
      v-model="filtersProxy"
      :cities="cities"
      :categories="categories"
      :searchEnabled="!searchDown"
      @reset="reset"
    />

    <ErrorBanner
      v-if="searchDown"
      severity="warn"
      title="Search is unavailable"
      error="Showing upcoming events straight from the database. Text search, categories, dates and price filters stay off until Elasticsearch is back."
      style="margin-bottom: 1rem"
    />

    <AsyncState
      :loading="loading"
      :error="error"
      :empty="isEmpty"
      :emptyMessage="filtered ? 'No events match those filters.' : 'There are no events yet.'"
      @retry="run(appliedParams)"
    >
      <div class="grid-cards">
        <EventCard v-for="event in items" :key="event._id" :event="event" />
      </div>
    </AsyncState>

    <PaginationBar
      :page="filters.page"
      :totalPages="results?.totalPages ?? 0"
      :total="results?.total ?? 0"
      @update:page="filters.page = $event"
    />
  </div>
</template>
