<script setup>
import { computed, reactive, ref, watch } from 'vue';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';

const props = defineProps({
  /** The event being edited, or null when creating. */
  event: { type: Object, default: null },
  venues: { type: Array, default: () => [] },
  categorySuggestions: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false },
  submitLabel: { type: String, default: 'Save' },
});

const emit = defineEmits(['submit', 'cancel']);

const form = reactive({
  title: '',
  description: '',
  startsAt: null,
  price: 0,
  venue: null,
  categories: [],
});

const errors = reactive({});

watch(
  () => props.event,
  (event) => {
    if (!event) return;
    Object.assign(form, {
      title: event.title ?? '',
      description: event.description ?? '',
      startsAt: event.startsAt ? new Date(event.startsAt) : null,
      price: event.price ?? 0,
      venue: event.venue?._id ?? event.venue ?? null,
      categories: [...(event.categories ?? [])],
    });
  },
  { immediate: true }
);

const suggestions = ref([]);

function completeCategory({ query }) {
  const term = query.trim().toLowerCase();
  const matches = props.categorySuggestions.filter(
    (option) => option.toLowerCase().includes(term) && !form.categories.includes(option)
  );
  suggestions.value = term && !matches.includes(term) ? [term, ...matches] : matches;
}

const selectedVenue = computed(() => props.venues.find((venue) => venue._id === form.venue));

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key]);

  if (form.title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
  if (form.description.trim().length < 10)
    errors.description = 'Description must be at least 10 characters';
  if (!form.startsAt) errors.startsAt = 'Pick a start date and time';
  if (!form.venue) errors.venue = 'Choose a venue';
  if (form.price === null || form.price < 0) errors.price = 'Price cannot be negative';

  return Object.keys(errors).length === 0;
}

function submit() {
  if (!validate()) return;
  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim(),
    startsAt: form.startsAt.toISOString(),
    price: form.price,
    venue: form.venue,
    categories: form.categories.map((category) => category.trim()).filter(Boolean),
  });
}
</script>

<template>
  <form class="stack" novalidate @submit.prevent="submit">
    <div class="field">
      <label for="title">Title</label>
      <InputText id="title" v-model="form.title" :invalid="Boolean(errors.title)" fluid />
      <small v-if="errors.title" class="field__error">{{ errors.title }}</small>
    </div>

    <div class="field">
      <label for="description">Description</label>
      <Textarea
        id="description"
        v-model="form.description"
        rows="6"
        autoResize
        :invalid="Boolean(errors.description)"
        fluid
      />
      <small v-if="errors.description" class="field__error">{{ errors.description }}</small>
    </div>

    <div class="row" style="align-items: flex-start; gap: 1rem">
      <div class="field" style="flex: 1 1 240px">
        <label for="startsAt">Starts at</label>
        <DatePicker
          id="startsAt"
          v-model="form.startsAt"
          showTime
          hourFormat="24"
          showIcon
          dateFormat="yy-mm-dd"
          :invalid="Boolean(errors.startsAt)"
          fluid
        />
        <small v-if="errors.startsAt" class="field__error">{{ errors.startsAt }}</small>
      </div>

      <div class="field" style="flex: 1 1 160px">
        <label for="price">Price</label>
        <InputNumber
          id="price"
          v-model="form.price"
          mode="currency"
          currency="USD"
          :min="0"
          :invalid="Boolean(errors.price)"
          fluid
        />
        <small v-if="errors.price" class="field__error">{{ errors.price }}</small>
      </div>
    </div>

    <div class="field">
      <label for="venue">Venue</label>
      <Select
        id="venue"
        v-model="form.venue"
        :options="venues"
        optionLabel="name"
        optionValue="_id"
        filter
        placeholder="Choose a venue"
        :invalid="Boolean(errors.venue)"
        fluid
      >
        <template #option="{ option }">
          <div>
            {{ option.name }}
            <span class="muted"> · {{ option.city }} · {{ option.capacity }} seats</span>
          </div>
        </template>
      </Select>
      <small v-if="errors.venue" class="field__error">{{ errors.venue }}</small>
      <small v-else-if="selectedVenue" class="muted">
        Capacity {{ selectedVenue.capacity }} — the event inherits it, there is no separate limit.
      </small>
    </div>

    <div class="field">
      <label for="categories">Categories</label>
      <AutoComplete
        id="categories"
        v-model="form.categories"
        multiple
        fluid
        :suggestions="suggestions"
        :typeahead="false"
        placeholder="Type and press enter"
        @complete="completeCategory"
      />
    </div>

    <div class="row">
      <Button type="submit" :label="submitLabel" :loading="submitting" />
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        text
        @click="$emit('cancel')"
      />
    </div>
  </form>
</template>
