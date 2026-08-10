<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import ErrorBanner from '@/components/common/ErrorBanner.vue';
import * as eventsApi from '@/api/events.api.js';
import { useAuthStore } from '@/stores/auth.store.js';
import { isPast } from '@/utils/format.js';

const props = defineProps({
  event: { type: Object, required: true },
});

const emit = defineEmits(['changed']);

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const ticketCount = ref(1);
const busy = ref(false);
const failure = ref(null);

const registered = computed(() => props.event.myRegistration?.status === 'confirmed');
const soldOut = computed(() => props.event.seatsRemaining !== null && props.event.seatsRemaining <= 0);
const over = computed(() => isPast(props.event.startsAt));
const maxTickets = computed(() => Math.min(20, Math.max(1, props.event.seatsRemaining ?? 1)));


async function act(operation) {
  failure.value = null;
  busy.value = true;
  try {
    await operation();
    emit('changed');
  } catch (err) {
    failure.value = err;
    if (err.status === 409) emit('changed');
  } finally {
    busy.value = false;
  }
}

const register = () =>
  act(() => eventsApi.registerForEvent(props.event._id, ticketCount.value));
const cancel = () => act(() => eventsApi.cancelRegistration(props.event._id));

function signIn() {
  router.push({ name: 'login', query: { redirect: route.fullPath } });
}
</script>

<template>
  <div class="stack" style="gap: 0.75rem">
    <ErrorBanner :error="failure" />

    <template v-if="over">
      <p class="muted" style="margin: 0">This event has already taken place.</p>
    </template>

    <template v-else-if="!auth.isAuthenticated">
      <Button label="Sign in to register" icon="pi pi-sign-in" @click="signIn" />
      <p class="muted" style="margin: 0; font-size: 0.85rem">
        You need an account to take a seat.
      </p>
    </template>

    <template v-else-if="auth.isOrganizer">
      <p class="muted" style="margin: 0">
        Organizer accounts manage events rather than attend them.
      </p>
    </template>

    <template v-else-if="registered">
      <p style="margin: 0">
        <i class="pi pi-check-circle" style="color: #12b76a" />
        You are registered for
        {{ event.myRegistration.ticketCount }}
        ticket{{ event.myRegistration.ticketCount === 1 ? '' : 's' }}.
      </p>
      <Button
        label="Cancel registration"
        icon="pi pi-times"
        severity="danger"
        outlined
        :loading="busy"
        @click="cancel"
      />
    </template>

    <template v-else-if="soldOut">
      <Button label="Sold out" icon="pi pi-ban" disabled />
      <p class="muted" style="margin: 0; font-size: 0.85rem">
        Every seat at this venue is taken. Check back — cancellations free seats up.
      </p>
    </template>

    <template v-else>
      <div class="field">
        <label for="tickets">Tickets</label>
        <InputNumber
          id="tickets"
          v-model="ticketCount"
          :min="1"
          :max="maxTickets"
          showButtons
          fluid
        />
      </div>
      <Button label="Register" icon="pi pi-ticket" :loading="busy" @click="register" />
    </template>
  </div>
</template>
