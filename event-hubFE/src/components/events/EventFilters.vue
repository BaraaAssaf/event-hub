<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { toDateInput } from '@/utils/format.js';

const props = defineProps({
  modelValue: { type: Object, required: true },
  cities: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  searchEnabled: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue', 'reset']);

const sortOptions = computed(() => [
  ...(props.searchEnabled ? [{ label: 'Best match', value: 'relevance' }] : []),
  { label: 'Soonest', value: 'soonest' },
  { label: 'Cheapest', value: 'cheapest' },
]);

function field(key, { parse } = {}) {
  return computed({
    get: () => props.modelValue[key],
    set: (value) => emit('update:modelValue', { ...props.modelValue, [key]: parse ? parse(value) : value }),
  });
}

const toDateOrNull = (value) => (value ? toDateInput(value) : null);
const asDate = (value) => (value ? new Date(`${value}T00:00:00`) : null);

const q = field('q');
const city = field('city');
const category = field('category');
const minPrice = field('minPrice');
const maxPrice = field('maxPrice');
const sort = field('sort');

const from = computed({
  get: () => asDate(props.modelValue.from),
  set: (value) => emit('update:modelValue', { ...props.modelValue, from: toDateOrNull(value) }),
});
const to = computed({
  get: () => asDate(props.modelValue.to),
  set: (value) => emit('update:modelValue', { ...props.modelValue, to: toDateOrNull(value) }),
});

const hasFilters = computed(() =>
  ['q', 'city', 'category', 'from', 'to', 'minPrice', 'maxPrice'].some(
    (key) => props.modelValue[key] !== '' && props.modelValue[key] !== null
  )
);
</script>

<template>
  <section class="filters">
    <div class="field filters__search">
      <label for="q">Search</label>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          id="q"
          v-model="q"
          fluid
          :disabled="!searchEnabled"
          :placeholder="
            searchEnabled
              ? 'Search titles and descriptions…'
              : 'Full-text search is unavailable right now'
          "
        />
      </IconField>
    </div>

    <div class="field">
      <label for="city">City</label>
      <Select
        id="city"
        v-model="city"
        :options="cities"
        showClear
        filter
        placeholder="Any city"
      />
    </div>

    <div class="field">
      <label for="category">Category</label>
      <Select
        id="category"
        v-model="category"
        :options="categories"
        showClear
        filter
        placeholder="Any category"
        :disabled="!searchEnabled"
      />
    </div>

    <div class="field">
      <label for="from">From</label>
      <DatePicker
        id="from"
        v-model="from"
        dateFormat="yy-mm-dd"
        showIcon
        showButtonBar
        :disabled="!searchEnabled"
        placeholder="Any date"
      />
    </div>

    <div class="field">
      <label for="to">To</label>
      <DatePicker
        id="to"
        v-model="to"
        dateFormat="yy-mm-dd"
        showIcon
        showButtonBar
        :minDate="from ?? undefined"
        :disabled="!searchEnabled"
        placeholder="Any date"
      />
    </div>

    <div class="field">
      <label for="minPrice">Min price</label>
      <InputNumber
        id="minPrice"
        v-model="minPrice"
        :min="0"
        mode="currency"
        currency="USD"
        showButtons
        :disabled="!searchEnabled"
        placeholder="0"
      />
    </div>

    <div class="field">
      <label for="maxPrice">Max price</label>
      <InputNumber
        id="maxPrice"
        v-model="maxPrice"
        :min="0"
        mode="currency"
        currency="USD"
        showButtons
        :disabled="!searchEnabled"
        placeholder="Any"
      />
    </div>

    <div class="field">
      <label for="sort">Sort</label>
      <Select id="sort" v-model="sort" :options="sortOptions" optionLabel="label" optionValue="value" />
    </div>

    <div class="field">
      <label>&nbsp;</label>
      <Button
        label="Clear"
        icon="pi pi-filter-slash"
        severity="secondary"
        outlined
        :disabled="!hasFilters"
        @click="$emit('reset')"
      />
    </div>
  </section>
</template>
