import { request } from './client.js';

export function listVenues(params) {
  return request('/venues', { query: params });
}

export function getVenue(id) {
  return request(`/venues/${id}`).then((res) => res.venue);
}

export function createVenue(body) {
  return request('/venues', { method: 'POST', body }).then((res) => res.venue);
}

export function updateVenue(id, body) {
  return request(`/venues/${id}`, { method: 'PUT', body }).then((res) => res.venue);
}

export function deleteVenue(id) {
  return request(`/venues/${id}`, { method: 'DELETE' });
}
