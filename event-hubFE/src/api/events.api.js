import { request, withId } from './client.js';


function toCard(item) {
  const record = withId(item);
  return {
    _id: record._id,
    title: record.title,
    description: record.description,
    startsAt: record.startsAt,
    price: record.price,
    categories: record.categories ?? [],
    city: record.city ?? record.venue?.city ?? null,
    venueName: record.venueName ?? record.venue?.name ?? null,
    highlight: record.highlight ?? null,
    seatsRemaining: record.seatsRemaining ?? null,
  };
}

function toCardPage(page) {
  return { ...page, items: page.items.map(toCard) };
}

export async function searchEvents(params) {
  return toCardPage(await request('/events/search', { query: params }));
}

export async function listEvents(params) {
  return toCardPage(await request('/events', { query: params }));
}

export function getEvent(id) {
  return request(`/events/${id}`).then((res) => res.event);
}

export function createEvent(body) {
  return request('/events', { method: 'POST', body }).then((res) => res.event);
}

export function updateEvent(id, body) {
  return request(`/events/${id}`, { method: 'PUT', body }).then((res) => res.event);
}

export function deleteEvent(id) {
  return request(`/events/${id}`, { method: 'DELETE' });
}

export function registerForEvent(id, ticketCount = 1) {
  return request(`/events/${id}/register`, {
    method: 'POST',
    body: { ticketCount },
  }).then((res) => res.registration);
}

export function cancelRegistration(id) {
  return request(`/events/${id}/register`, { method: 'DELETE' }).then((res) => res.registration);
}

export function listAttendees(id, params) {
  return request(`/events/${id}/attendees`, { query: params });
}
