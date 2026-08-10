<script setup>
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import AsyncState from '@/components/common/AsyncState.vue';
import RegisterButton from '@/components/events/RegisterButton.vue';
import { useAsync } from '@/composables/useAsync.js';
import * as eventsApi from '@/api/events.api.js';
import { useAuthStore } from '@/stores/auth.store.js';
import { formatDateTime, formatPrice, isPast } from '@/utils/format.js';

const props = defineProps({
  id: { type: String, required: true },
});

const auth = useAuthStore();
const router = useRouter();

const { data: event, error, loading, run } = useAsync(eventsApi.getEvent);

watch(() => props.id, (id) => run(id), { immediate: true });

const mine = computed(
  () => auth.isOrganizer && event.value?.organizer?._id === auth.user?._id
);
const seats = computed(() => event.value?.seatsRemaining);
const over = computed(() => isPast(event.value?.startsAt));

async function remove() {
  if (!window.confirm('Delete this event? Its registrations will be removed too.')) return;
  await eventsApi.deleteEvent(props.id);
  router.push({ name: 'organizer' });
}
</script>

<template>
  <AsyncState :loading="loading" :error="error" @retry="run(id)">
    <article v-if="event" class="detail-grid">
      <div class="stack">
        <div class="card stack">
          <div class="page-head" style="margin: 0">
            <div>
              <h1>{{ event.title }}</h1>
              <p class="muted" style="margin: 0">
                <i class="pi pi-calendar" /> {{ formatDateTime(event.startsAt) }}
                <span v-if="over"> · finished</span>
              </p>
            </div>
            <div v-if="mine" class="row">
              <RouterLink :to="{ name: 'event-edit', params: { id: event._id } }">
                <Button label="Edit" icon="pi pi-pencil" size="small" severity="secondary" outlined />
              </RouterLink>
              <Button
                label="Delete"
                icon="pi pi-trash"
                size="small"
                severity="danger"
                outlined
                @click="remove"
              />
            </div>
          </div>

          <div class="row" style="gap: 0.35rem">
            <span v-for="category in event.categories" :key="category" class="chip">
              {{ category }}
            </span>
          </div>

          <p style="white-space: pre-line; margin: 0">{{ event.description }}</p>
        </div>

        <div class="card">
          <h2>Venue</h2>
          <dl class="detail-list">
            <dt>Name</dt>
            <dd>{{ event.venue?.name ?? '—' }}</dd>
            <dt>Address</dt>
            <dd>{{ event.venue?.address ?? '—' }}</dd>
            <dt>City</dt>
            <dd>{{ event.venue?.city ?? '—' }}</dd>
            <dt>Capacity</dt>
            <dd>{{ event.capacity ?? '—' }}</dd>
          </dl>
        </div>

        <div class="card">
          <h2>Organizer</h2>
          <p class="muted" style="margin: 0">
            {{ event.organizer?.name }} · {{ event.organizer?.email }}
          </p>
        </div>
      </div>

      <aside class="card stack" style="position: sticky; top: 5rem">
        <div>
          <p class="muted" style="margin: 0">Price</p>
          <p class="seats">{{ formatPrice(event.price) }}</p>
        </div>
        <div>
          <p class="muted" style="margin: 0">Seats remaining</p>
          <p class="seats" :style="{ color: seats === 0 ? '#b42318' : 'inherit' }">
            {{ seats ?? '—' }}
            <span class="muted" style="font-size: 0.9rem; font-weight: 400">
              of {{ event.capacity ?? '—' }}
            </span>
          </p>
        </div>

        <RegisterButton :event="event" @changed="run(id)" />
      </aside>
    </article>
  </AsyncState>
</template>
