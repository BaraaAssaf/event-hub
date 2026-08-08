import * as venueService from '../services/venue.service.js';

export async function list(req, res) {
  const result = await venueService.listVenues(req.query);
  res.json(result);
}

export async function getOne(req, res) {
  const venue = await venueService.getVenueById(req.params.id);
  res.json({ venue });
}

export async function create(req, res) {
  const venue = await venueService.createVenue(req.body);
  res.status(201).json({ venue });
}

export async function update(req, res) {
  const venue = await venueService.updateVenue(req.params.id, req.body);
  res.json({ venue });
}

export async function remove(req, res) {
  await venueService.deleteVenue(req.params.id);
  res.status(204).send();
}
