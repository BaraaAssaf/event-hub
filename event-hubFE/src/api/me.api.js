import { request } from './client.js';

export function myRegistrations(params) {
  return request('/me/registrations', { query: params });
}

export function myEvents() {
  return request('/me/events');
}
