import { computed, onScopeDispose, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useQuerySync(fields, options = {}) {
  const {
    pageKey = 'page',
    debounceMs = 300,
    router = useRouter(),
    route = useRoute(),
  } = options;

  const entries = Object.entries(fields);

  function readQuery(query) {
    const state = {};
    for (const [key, field] of entries) {
      const raw = Array.isArray(query[key]) ? query[key][0] : query[key];
      const parse = field.parse ?? ((value) => value);
      state[key] = raw === undefined || raw === null || raw === '' ? field.default : parse(raw);
    }
    return state;
  }

  function writeQuery(state) {
    const query = {};
    for (const [key, field] of entries) {
      const value = state[key];
      if (value === undefined || value === null || value === '') continue;
      if (isSame(value, field.default)) continue;
      query[key] = (field.serialize ?? String)(value);
    }
    return query;
  }

  const filters = reactive(readQuery(route.query));

  let pending = null;
  let lastCommitted = writeQuery(filters);

  function cancelPending() {
    if (pending) clearTimeout(pending);
    pending = null;
  }

  watch(
    () => route.query,
    (query) => {
      const next = readQuery(query);
      lastCommitted = writeQuery(next);
      if (entries.every(([key]) => isSame(next[key], filters[key]))) return;
      cancelPending();
      Object.assign(filters, next);
    }
  );

  watch(
    () => writeQuery(filters),
    (query) => {
      const changed = changedKeys(lastCommitted, query);
      if (changed.length === 0) return;

      const onlyPaging = changed.every((key) => key === pageKey);
      if (!onlyPaging) delete query[pageKey];

      const debounced = changed.every((key) => fields[key]?.debounce);
      lastCommitted = query;
      cancelPending();

      const commit = () => {
        pending = null;
        router[debounced ? 'replace' : 'push']({ query });
      };
      if (debounced) pending = setTimeout(commit, debounceMs);
      else commit();
    }
  );

  onScopeDispose(cancelPending);

  function reset() {
    for (const [key, field] of entries) filters[key] = field.default;
  }

  const appliedParams = computed(() => writeQuery(readQuery(route.query)));

  return { filters, reset, appliedParams };
}

function isSame(a, b) {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return a === b;
}

function changedKeys(before, after) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => before[key] !== after[key]);
}
