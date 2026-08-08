import * as registrationService from '../services/registration.service.js';
import * as statsService from '../services/stats.service.js';

export async function registrations(req, res) {
  res.json(await registrationService.listMyRegistrations(req.auth.sub, req.query));
}

export async function events(req, res) {
  const items = await statsService.organizerEvents(req.auth.sub);
  res.json({ items, total: items.length });
}
