import { defineComponent, nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuerySync } from '@/composables/useQuerySync.js';

const fields = {
  q: { default: '', debounce: true },
  city: { default: '' },
  minPrice: { default: null, parse: Number },
  sort: { default: 'relevance' },
  page: { default: 1, parse: Number },
};

const Harness = defineComponent({
  setup: () => useQuerySync(fields),
  template: '<div />',
});

async function mountAt(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: Harness }],
  });
  router.push(path);
  await router.isReady();

  const wrapper = mount(Harness, { global: { plugins: [router] } });
  return { wrapper, router };
}

/** One tick for the watcher, one microtask flush for the navigation. */
async function settle() {
  await nextTick();
  await flushPromises();
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useQuerySync', () => {
  it('seeds the filters from the URL, parsing and defaulting as declared', async () => {
    const { wrapper } = await mountAt('/?q=node&minPrice=25&page=3');

    expect(wrapper.vm.filters).toMatchObject({
      q: 'node',
      city: '',
      minPrice: 25,
      sort: 'relevance',
      page: 3,
    });
  });

  it('leaves defaults out of the URL so a clean list stays a clean link', async () => {
    const { wrapper, router } = await mountAt('/?q=node');

    wrapper.vm.filters.q = '';
    await settle();
    vi.advanceTimersByTime(400);
    await settle();

    expect(router.currentRoute.value.query).toEqual({});
  });

  it('writes an instant filter to the URL with push', async () => {
    const { wrapper, router } = await mountAt('/');
    const push = vi.spyOn(router, 'push');

    wrapper.vm.filters.city = 'Berlin';
    await settle();

    expect(router.currentRoute.value.query).toEqual({ city: 'Berlin' });
    expect(push).toHaveBeenCalled();
  });

  it('debounces the free-text box and replaces instead of pushing', async () => {
    const { wrapper, router } = await mountAt('/');
    const push = vi.spyOn(router, 'push');
    const replace = vi.spyOn(router, 'replace');

    wrapper.vm.filters.q = 'n';
    await settle();
    wrapper.vm.filters.q = 'no';
    await settle();
    wrapper.vm.filters.q = 'node';
    await settle();

    // Still nothing committed while the user is typing.
    expect(router.currentRoute.value.query).toEqual({});

    vi.advanceTimersByTime(300);
    await settle();

    expect(router.currentRoute.value.query).toEqual({ q: 'node' });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it('rewinds to page one when a filter changes', async () => {
    const { wrapper, router } = await mountAt('/?city=Berlin&page=4');

    wrapper.vm.filters.city = 'Amman';
    await settle();

    expect(router.currentRoute.value.query).toEqual({ city: 'Amman' });
    expect(wrapper.vm.filters.page).toBe(1);
  });

  it('keeps the page when only the page changes', async () => {
    const { wrapper, router } = await mountAt('/?city=Berlin');

    wrapper.vm.filters.page = 2;
    await settle();

    expect(router.currentRoute.value.query).toEqual({ city: 'Berlin', page: '2' });
  });

  it('follows the URL backwards, which is what makes Back work', async () => {
    const { wrapper, router } = await mountAt('/');

    wrapper.vm.filters.city = 'Berlin';
    await settle();
    expect(wrapper.vm.filters.city).toBe('Berlin');

    router.back();
    await settle();

    expect(router.currentRoute.value.query).toEqual({});
    expect(wrapper.vm.filters.city).toBe('');
  });

  it('exposes the applied params from the URL, not the pending keystroke', async () => {
    const { wrapper } = await mountAt('/?city=Berlin');

    wrapper.vm.filters.q = 'node';
    await settle();
    expect(wrapper.vm.appliedParams).toEqual({ city: 'Berlin' });

    vi.advanceTimersByTime(300);
    await settle();
    expect(wrapper.vm.appliedParams).toEqual({ city: 'Berlin', q: 'node' });
  });

  it('reset clears everything back to defaults in one navigation', async () => {
    const { wrapper, router } = await mountAt('/?q=node&city=Berlin&minPrice=10&page=2');

    wrapper.vm.reset();
    await settle();
    vi.advanceTimersByTime(300);
    await settle();

    expect(router.currentRoute.value.query).toEqual({});
  });
});
