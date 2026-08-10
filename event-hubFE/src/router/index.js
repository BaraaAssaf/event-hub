import { createRouter, createWebHistory } from 'vue-router';
import EventsListView from '@/views/EventsListView.vue';
import { installGuards } from './guards.js';

export const routes = [
   {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true, title: 'Sign in' },
  },
    {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { status: 403, title: 'No access' },
  },

];

export function withId(record) {
  if (!record || record._id) return record;
  const { id, ...rest } = record;
  return { _id: id, ...rest };
}

installGuards(router);

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · EventHub` : 'EventHub';
});
