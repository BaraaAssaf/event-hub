<script setup>
import { computed, ref } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import AsyncState from '@/components/common/AsyncState.vue';
import ErrorBanner from '@/components/common/ErrorBanner.vue';
import { useAsync } from '@/composables/useAsync.js';
import * as eventsApi from '@/api/events.api.js';
import * as meApi from '@/api/me.api.js';
import { formatDateTime, formatPrice, isPast } from '@/utils/format.js';

const { data, error, loading, run } = useAsync(meApi.myEvents, {
  initialData: { items: [], total: 0 },
});

run();

const events = computed(() => data.value?.items ?? []);
const isEmpty = computed(() => !loading.value && events.value.length === 0);
const totalRegistrations = computed(() =>
  events.value.reduce((sum, event) => sum + event.registrationCount, 0)
);

const removeError = ref(null);
const removing = ref(null);

async function remove(event) {
  if (!window.confirm(`Delete "${event.title}"? Its registrations go with it.`)) return;
  removeError.value = null;
  removing.value = event._id;
  try {
    await eventsApi.deleteEvent(event._id);
    await run();
  } catch (err) {

    removeError.value = err;
    if (err.status === 403 || err.status === 404) await run();
  } finally {
    removing.value = null;
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>My events</h1>
        <p class="muted" style="margin: 0">
          {{ events.length }} event{{ events.length === 1 ? '' : 's' }} ·
          {{ totalRegistrations }} confirmed registration{{ totalRegistrations === 1 ? '' : 's' }}
        </p>
      </div>
      <RouterLink :to="{ name: 'event-create' }">
        <Button label="New event" icon="pi pi-plus" />
      </RouterLink>
    </div>

    <ErrorBanner :error="removeError" style="margin-bottom: 1rem" />

    <AsyncState :loading="loading" :error="error" :empty="isEmpty" @retry="run">
      <template #empty>
        <div class="state state--empty">
          <i class="pi pi-calendar-plus" style="font-size: 1.75rem" />
          <p>You have not created an event yet.</p>
          <RouterLink :to="{ name: 'event-create' }">
            <Button label="Create your first event" icon="pi pi-plus" />
          </RouterLink>
        </div>
      </template>

      <div class="card" style="padding: 0.5rem 1rem">
        <table class="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>When</th>
              <th>Price</th>
              <th>Registered</th>
              <th>Seats left</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in events" :key="event._id">
              <td>
                <RouterLink :to="{ name: 'event-detail', params: { id: event._id } }">
                  {{ event.title }}
                </RouterLink>
                <div class="muted" style="font-size: 0.82rem">
                  {{ event.venue.name }}, {{ event.venue.city }}
                </div>
              </td>
              <td>
                {{ formatDateTime(event.startsAt) }}
                <Tag v-if="isPast(event.startsAt)" value="past" severity="secondary" />
              </td>
              <td>{{ formatPrice(event.price) }}</td>
              <td>{{ event.registrationCount }}</td>
              <td>
                <Tag
                  :value="String(event.remainingSeats)"
                  :severity="event.remainingSeats <= 0 ? 'danger' : 'success'"
                />
              </td>
              <td style="text-align: right; white-space: nowrap">
                <RouterLink :to="{ name: 'event-edit', params: { id: event._id } }">
                  <Button icon="pi pi-pencil" size="small" severity="secondary" text aria-label="Edit" />
                </RouterLink>
                <Button
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  text
                  aria-label="Delete"
                  :loading="removing === event._id"
                  @click="remove(event)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AsyncState>
  </div>
</template>
