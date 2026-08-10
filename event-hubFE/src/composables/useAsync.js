import { ref, shallowRef } from 'vue';

export function useAsync(fn, { initialData = null } = {}) {
  const data = ref(initialData);
  const error = shallowRef(null);
  const loading = ref(false);

  let latest = 0;

  async function run(...args) {
    const ticket = ++latest;
    loading.value = true;
    error.value = null;

    try {
      const result = await fn(...args);
      if (ticket === latest) data.value = result;
      return result;
    } catch (err) {
      if (err.name === 'AbortError') return undefined;
      if (ticket === latest) error.value = err;
      return undefined;
    } finally {
      if (ticket === latest) loading.value = false;
    }
  }

  function reset() {
    latest += 1;
    data.value = initialData;
    error.value = null;
    loading.value = false;
  }

  return { data, error, loading, run, reset };
}
