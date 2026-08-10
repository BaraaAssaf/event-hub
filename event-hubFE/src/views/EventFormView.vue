<script setup>
import { computed, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import AsyncState from '@/components/common/AsyncState.vue';
import ErrorBanner from '@/components/common/ErrorBanner.vue';
import EventForm from '@/components/events/EventForm.vue';
import { useAsync } from '@/composables/useAsync.js';
import * as eventsApi from '@/api/events.api.js';
import * as venuesApi from '@/api/venues.api.js';

const props = defineProps({
  id: { type: String, default: null },
});

const router = useRouter();
const editing = computed(() => Boolean(props.id));

const venues = ref([]);
const venuesError = ref(null);
const categorySuggestions = ref([]);

const { data: event, error: loadError, loading, run: load } = useAsync(eventsApi.getEvent);

watchEffect(() => {
  if (props.id) load(props.id);
});

venuesApi
  .listVenues({ limit: 100 })
  .then((page) => {
    venues.value = page.items;
  })
  .catch((err) => {
    venuesError.value = err;
  });

eventsApi
  .listEvents({ limit: 100 })
  .then((page) => {
    categorySuggestions.value = [
      ...new Set(page.items.flatMap((item) => item.categories)),
    ].sort();
  })
  .catch(() => {
  });

const submitting = ref(false);
const failure = ref(null);

async function submit(payload) {
  failure.value = null;
  submitting.value = true;
  try {
    const saved = editing.value
      ? await eventsApi.updateEvent(props.id, payload)
      : await eventsApi.createEvent(payload);
    router.push({ name: 'event-detail', params: { id: saved._id } });
  } catch (err) {
    failure.value = err;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div style="max-width: 720px">
    <div class="page-head">
      <div>
        <h1>{{ editing ? 'Edit event' : 'New event' }}</h1>
        <p class="muted" style="margin: 0">
          Capacity comes from the venue you pick, so there is nothing to set here.
        </p>
      </div>
    </div>

    <ErrorBanner
      :error="failure"
      :title="failure?.status === 403 ? 'That event belongs to another organizer' : null"
      style="margin-bottom: 1rem"
    />
    <ErrorBanner
      :error="venuesError"
      title="Could not load venues"
      style="margin-bottom: 1rem"
    />

    <AsyncState :loading="editing && loading" :error="loadError" @retry="load(id)">
      <div class="card">
        <EventForm
          :event="event"
          :venues="venues"
          :categorySuggestions="categorySuggestions"
          :submitting="submitting"
          :submitLabel="editing ? 'Save changes' : 'Create event'"
          @submit="submit"
          @cancel="router.back()"
        />
      </div>
    </AsyncState>
  </div>
</template>
