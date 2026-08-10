import { createMemoryHistory, createRouter } from 'vue-router';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/events.api.js');
vi.mock('@/api/venues.api.js');
vi.mock('@/api/me.api.js');

import * as eventsApi from '@/api/events.api.js';
import * as venuesApi from '@/api/venues.api.js';
import * as meApi from '@/api/me.api.js';
import { ApiError } from '@/api/client.js';
import EventsListView from '@/views/EventsListView.vue';
import EventDetailView from '@/views/EventDetailView.vue';
import EventFormView from '@/views/EventFormView.vue';
import LoginView from '@/views/LoginView.vue';
import MyRegistrationsView from '@/views/MyRegistrationsView.vue';
import OrganizerDashboardView from '@/views/OrganizerDashboardView.vue';
import RegisterView from '@/views/RegisterView.vue';
import { routes } from '@/router/index.js';

const hit = {
  _id: 'e1',
  title: 'Node.js Deep Dive',
  description: 'All about the event loop.',
  startsAt: '2099-01-01T18:00:00.000Z',
  price: 25,
  categories: ['tech'],
  city: 'Berlin',
  venueName: 'The Basement',
  highlight: { title: ['<em>Node</em>.js Deep Dive'] },
  seatsRemaining: null,
};

const detail = {
  _id: 'e1',
  title: 'Node.js Deep Dive',
  description: 'All about the event loop.',
  startsAt: '2099-01-01T18:00:00.000Z',
  price: 25,
  categories: ['tech'],
  capacity: 100,
  seatsRemaining: 42,
  venue: { _id: 'v1', name: 'The Basement', city: 'Berlin', address: '1 Main St', capacity: 100 },
  organizer: { _id: 'u1', name: 'Grace Hopper', email: 'grace@eventhub.dev' },
};

async function render(component, { path = '/', props = {} } = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes });
  router.push(path);
  await router.isReady();

  const wrapper = mount(component, {
    props,
    global: { plugins: [router, createPinia(), PrimeVue] },
  });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  vi.resetAllMocks();
  venuesApi.listVenues.mockResolvedValue({ items: [{ _id: 'v1', city: 'Berlin' }] });
});

describe('EventsListView', () => {
  it('renders a card per hit and marks the matched term', async () => {
    eventsApi.searchEvents.mockResolvedValue({
      items: [hit],
      page: 1,
      total: 1,
      totalPages: 1,
    });

    const wrapper = await render(EventsListView, { path: '/?q=node' });

    expect(eventsApi.searchEvents).toHaveBeenCalledWith({ q: 'node' });
    expect(wrapper.text()).toContain('Node.js Deep Dive');
    expect(wrapper.text()).toContain('The Basement');
    expect(wrapper.find('mark').text()).toBe('Node');
    expect(wrapper.text()).toContain('1 result');
  });

  it('falls back to the plain listing and warns when search is down', async () => {
    eventsApi.searchEvents.mockRejectedValue(
      new ApiError(503, { message: 'Search is unavailable', code: 'SERVICE_UNAVAILABLE' })
    );
    eventsApi.listEvents.mockResolvedValue({ items: [hit], page: 1, total: 1, totalPages: 1 });

    const wrapper = await render(EventsListView, { path: '/?city=Berlin' });

    expect(eventsApi.listEvents).toHaveBeenCalledWith({
      city: 'Berlin',
      page: undefined,
      upcoming: 'true',
    });
    expect(wrapper.text()).toContain('Search is unavailable');
    expect(wrapper.text()).toContain('Node.js Deep Dive');
  });

  it('shows an empty state rather than a bare page when nothing matches', async () => {
    eventsApi.searchEvents.mockResolvedValue({ items: [], page: 1, total: 0, totalPages: 0 });

    const wrapper = await render(EventsListView, { path: '/?q=nothing' });

    expect(wrapper.text()).toContain('No events match those filters.');
  });

  it('surfaces an unexpected failure instead of an empty list', async () => {
    eventsApi.searchEvents.mockRejectedValue(
      new ApiError(500, { message: 'Internal server error' })
    );

    const wrapper = await render(EventsListView);

    expect(wrapper.text()).toContain('Internal server error');
  });
});

describe('EventDetailView', () => {
  it('shows the venue, organizer, seats and a prompt to sign in', async () => {
    eventsApi.getEvent.mockResolvedValue(detail);

    const wrapper = await render(EventDetailView, { path: '/events/e1', props: { id: 'e1' } });

    expect(wrapper.text()).toContain('The Basement');
    expect(wrapper.text()).toContain('Grace Hopper');
    expect(wrapper.text()).toContain('42');
    expect(wrapper.text()).toContain('Sign in to register');
  });

  it('offers cancel instead of register once the caller holds a seat', async () => {
    eventsApi.getEvent.mockResolvedValue({
      ...detail,
      myRegistration: { _id: 'r1', status: 'confirmed', ticketCount: 2 },
    });

    const wrapper = await render(EventDetailView, { path: '/events/e1', props: { id: 'e1' } });
    const { useAuthStore } = await import('@/stores/auth.store.js');
    useAuthStore().user = { _id: 'u9', name: 'Ada', role: 'attendee' };
    await flushPromises();

    expect(wrapper.text()).toContain('You are registered for 2 tickets');
    expect(wrapper.text()).not.toContain('Sign in to register');
  });

  it('reports a sold-out event without offering the button', async () => {
    eventsApi.getEvent.mockResolvedValue({ ...detail, seatsRemaining: 0, myRegistration: null });

    const wrapper = await render(EventDetailView, { path: '/events/e1', props: { id: 'e1' } });
    const { useAuthStore } = await import('@/stores/auth.store.js');
    useAuthStore().user = { _id: 'u9', name: 'Ada', role: 'attendee' };
    await flushPromises();

    expect(wrapper.text()).toContain('Sold out');
  });
});

describe('the remaining screens', () => {
  it('organizer dashboard lists events with counts and seats left', async () => {
    meApi.myEvents.mockResolvedValue({
      items: [
        {
          _id: 'e1',
          title: 'Node.js Deep Dive',
          startsAt: '2099-01-01T18:00:00.000Z',
          price: 25,
          venue: { name: 'The Basement', city: 'Berlin' },
          registrationCount: 3,
          remainingSeats: 97,
        },
      ],
      total: 1,
    });

    const wrapper = await render(OrganizerDashboardView, { path: '/organizer' });

    expect(wrapper.text()).toContain('Node.js Deep Dive');
    expect(wrapper.text()).toContain('3 confirmed registrations');
    expect(wrapper.text()).toContain('97');
  });

  it('organizer dashboard invites a first event when there are none', async () => {
    meApi.myEvents.mockResolvedValue({ items: [], total: 0 });

    const wrapper = await render(OrganizerDashboardView, { path: '/organizer' });

    expect(wrapper.text()).toContain('Create your first event');
  });

  it('my registrations lists the event and its venue', async () => {
    meApi.myRegistrations.mockResolvedValue({
      items: [
        {
          _id: 'r1',
          status: 'confirmed',
          ticketCount: 2,
          event: { ...detail, venue: detail.venue },
        },
      ],
      total: 1,
      totalPages: 1,
    });

    const wrapper = await render(MyRegistrationsView, { path: '/my/registrations' });

    expect(wrapper.text()).toContain('Node.js Deep Dive');
    expect(wrapper.text()).toContain('The Basement');
    expect(wrapper.text()).toContain('confirmed');
  });

  it('my registrations points an empty attendee at the event list', async () => {
    meApi.myRegistrations.mockResolvedValue({ items: [], total: 0, totalPages: 0 });

    const wrapper = await render(MyRegistrationsView, { path: '/my/registrations' });

    expect(wrapper.text()).toContain('You are not registered for any events yet.');
  });

  it('the event form prefills from the event being edited', async () => {
    eventsApi.getEvent.mockResolvedValue(detail);
    eventsApi.listEvents.mockResolvedValue({ items: [] });
    venuesApi.listVenues.mockResolvedValue({ items: [detail.venue] });

    const wrapper = await render(EventFormView, {
      path: '/organizer/events/e1/edit',
      props: { id: 'e1' },
    });

    expect(wrapper.text()).toContain('Edit event');
    expect(wrapper.find('#title').element.value).toBe('Node.js Deep Dive');
    expect(wrapper.find('#description').element.value).toContain('event loop');
  });

  it('the login screen renders its form', async () => {
    const wrapper = await render(LoginView, { path: '/login' });

    expect(wrapper.find('#email').exists()).toBe(true);
    expect(wrapper.text()).toContain('Sign in');
  });

  it('the register screen offers both roles', async () => {
    const wrapper = await render(RegisterView, { path: '/register' });

    expect(wrapper.find('#name').exists()).toBe(true);
    expect(wrapper.text()).toContain('Attend events');
    expect(wrapper.text()).toContain('Organize events');
  });
});
