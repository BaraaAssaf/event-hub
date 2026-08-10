import { createRouter, createWebHistory } from 'vue-router';
import EventsListView from '@/views/EventsListView.vue';
import { installGuards } from './guards.js';

export const routes = [
  {
    path: '/',
    name: 'events',
    component: EventsListView,
    meta: { title: 'Events' },
  },
  {
    path: '/events/:id',
    name: 'event-detail',
    component: () => import('@/views/EventDetailView.vue'),
    props: true,
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true, title: 'Sign in' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guestOnly: true, title: 'Create an account' },
  },
  {
    path: '/my/registrations',
    name: 'my-registrations',
    component: () => import('@/views/MyRegistrationsView.vue'),
    meta: { requiresAuth: true, title: 'My registrations' },
  },
  {
    path: '/organizer',
    name: 'organizer',
    component: () => import('@/views/OrganizerDashboardView.vue'),
    meta: { requiresAuth: true, roles: ['organizer'], title: 'My events' },
  },
  {
    path: '/organizer/events/new',
    name: 'event-create',
    component: () => import('@/views/EventFormView.vue'),
    meta: { requiresAuth: true, roles: ['organizer'], title: 'New event' },
  },
  {
    path: '/organizer/events/:id/edit',
    name: 'event-edit',
    component: () => import('@/views/EventFormView.vue'),
    props: true,
    meta: { requiresAuth: true, roles: ['organizer'], title: 'Edit event' },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { status: 403, title: 'No access' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { status: 404, title: 'Not found' },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved ?? { top: 0 },
});

installGuards(router);

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · EventHub` : 'EventHub';
});
