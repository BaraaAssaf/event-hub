<script setup>
import { computed, ref, watch } from 'vue';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import Tag from 'primevue/tag';
import AsyncState from '@/components/common/AsyncState.vue';
import ErrorBanner from '@/components/common/ErrorBanner.vue';
import PaginationBar from '@/components/common/PaginationBar.vue';
import { useAsync } from '@/composables/useAsync.js';
import * as eventsApi from '@/api/events.api.js';
import * as meApi from '@/api/me.api.js';
import { formatDateTime, formatPrice, isPast } from '@/utils/format.js';

const statuses = [
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'All', value: null },
];

const status = ref('confirmed');
const page = ref(1);
const cancelError = ref(null);
const cancelling = ref(null);

const { data, error, loading, run } = useAsync(meApi.myRegistrations, {
  initialData: { items: [], total: 0, totalPages: 0 },
});

const statusFilter = computed({
  get: () => status.value,
  set: (value) => {
    status.value = value;
    page.value = 1;
  },
});

const params = computed(() => ({ status: status.value ?? undefined, page: page.value }));

function load() {
  return run(params.value);
}

watch(params, load, { immediate: true });

const items = computed(() => data.value?.items ?? []);
const isEmpty = computed(() => !loading.value && items.value.length === 0);

async function cancel(registration) {
  cancelError.value = null;
  cancelling.value = registration._id;
  try {
    await eventsApi.cancelRegistration(registration.event._id);
    await load();
  } catch (err) {
    cancelError.value = err;
  } finally {
    cancelling.value = null;
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>My registrations</h1>
        <p class="muted" style="margin: 0">Everything you have a seat for.</p>
      </div>
      <SelectButton
        v-model="statusFilter"
        :options="statuses"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
      />
    </div>

    <ErrorBanner :error="cancelError" style="margin-bottom: 1rem" />

    <AsyncState
      :loading="loading"
      :error="error"
      :empty="isEmpty"
      emptyMessage="No registrations here yet."
      @retry="load"
    >
      <template #empty>
        <div class="state state--empty">
          <i class="pi pi-ticket" style="font-size: 1.75rem" />
          <p>
            {{
              status === 'cancelled'
                ? 'You have not cancelled anything.'
                : 'You are not registered for any events yet.'
            }}
          </p>
          <RouterLink :to="{ name: 'events' }">
            <Button label="Browse events" icon="pi pi-search" severity="secondary" outlined />
          </RouterLink>
        </div>
      </template>

      <div class="card" style="padding: 0.5rem 1rem">
        <table class="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>When</th>
              <th>Tickets</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="registration in items" :key="registration._id">
              <td>
                <RouterLink
                  v-if="registration.event"
                  :to="{ name: 'event-detail', params: { id: registration.event._id } }"
                >
                  {{ registration.event.title }}
                </RouterLink>
                <span v-else class="muted">Event removed</span>
                <div v-if="registration.event?.venue" class="muted" style="font-size: 0.82rem">
                  {{ registration.event.venue.name }}, {{ registration.event.venue.city }} ·
                  {{ formatPrice(registration.event.price) }}
                </div>
              </td>
              <td>{{ formatDateTime(registration.event?.startsAt) }}</td>
              <td>{{ registration.ticketCount }}</td>
              <td>
                <Tag
                  :value="registration.status"
                  :severity="registration.status === 'confirmed' ? 'success' : 'secondary'"
                />
              </td>
              <td style="text-align: right">
                <Button
                  v-if="registration.status === 'confirmed' && !isPast(registration.event?.startsAt)"
                  label="Cancel"
                  size="small"
                  severity="danger"
                  outlined
                  :loading="cancelling === registration._id"
                  @click="cancel(registration)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AsyncState>

    <PaginationBar
      v-model:page="page"
      :totalPages="data?.totalPages ?? 0"
      :total="data?.total ?? 0"
    />
  </div>
</template>
