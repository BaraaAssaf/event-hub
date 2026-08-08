import * as statsService from '../services/stats.service.js';

export async function topVenues(req, res) {
  const items = await statsService.topVenues(5);
  res.json({ items });
}
