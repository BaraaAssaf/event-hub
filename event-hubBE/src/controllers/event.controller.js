import * as eventService from '../services/event.service.js';
import * as registrationService from '../services/registration.service.js';
import { searchEvents } from '../search/event.search.js';

export async function list(req, res) {
  res.json(await eventService.listEvents(req.query));
}

export async function search(req, res) {
  res.json(await searchEvents(req.query));
}

export async function getOne(req, res) {
  const event = await eventService.getEventById(req.params.id, req.auth?.sub);
  res.json({ event });
}

export async function create(req, res) {
  const event = await eventService.createEvent(req.body, req.auth.sub);
  res.status(201).json({ event });
}

export async function update(req, res) {
  const event = await eventService.updateEvent(req.params.id, req.body, req.auth.sub);
  res.json({ event });
}

export async function remove(req, res) {
  await eventService.deleteEvent(req.params.id, req.auth.sub);
  res.status(204).send();
}

export async function attendees(req, res) {
  res.json(await eventService.listAttendees(req.params.id, req.auth.sub, req.query));
}

export async function register(req, res) {
  const registration = await registrationService.registerForEvent({
    userId: req.auth.sub,
    eventId: req.params.id,
    ticketCount: req.body.ticketCount,
  });
  res.status(201).json({ registration });
}

export async function cancelRegistration(req, res) {
  const registration = await registrationService.cancelRegistration({
    userId: req.auth.sub,
    eventId: req.params.id,
  });
  res.json({ registration });
}
