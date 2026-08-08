import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
  searchEventsQuerySchema,
  registerForEventSchema,
  paginationQuerySchema,
} from '../validators/event.validator.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Events
 *     description: Publishing, browsing and registering for events
 */

/**
 * @openapi
 * /events:
 *   get:
 *     tags: [Events]
 *     summary: List events
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: upcoming
 *         schema: { type: string, enum: ['true', 'false'] }
 *         description: Only events that have not started yet
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: A page of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/EventDetail' }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 total: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get('/', validate(listEventsQuerySchema, 'query'), asyncHandler(eventController.list));

/**
 * @openapi
 * /events/search:
 *   get:
 *     tags: [Events]
 *     summary: Full text search backed by Elasticsearch
 *     description: >
 *       Full text search across title and description, with the title weighted
 *       higher and AUTO fuzziness for typo tolerance. Returns highlighted
 *       fragments of the matched terms. Responds 503 if Elasticsearch is
 *       unavailable or the index has not been built.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Free text across title (boosted x3) and description
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [relevance, soonest, cheapest], default: relevance }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SearchResults' }
 *       400:
 *         description: Invalid query parameters
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
 *       503:
 *         description: Elasticsearch is unavailable or the index is missing
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
 */
router.get(
  '/search',
  validate(searchEventsQuerySchema, 'query'),
  asyncHandler(eventController.search)
);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     tags: [Events]
 *     summary: One event, including its venue, organizer and categories
 *     description: >
 *       Public. If a valid token is supplied the response also carries
 *       `myRegistration`, so the client can render register or cancel without
 *       a second request.
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event: { $ref: '#/components/schemas/EventDetail' }
 *       400: { description: Malformed id, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get(
  '/:id',
  optionalAuth,
  validate(idParamSchema, 'params'),
  asyncHandler(eventController.getOne)
);

/**
 * @openapi
 * /events:
 *   post:
 *     tags: [Events]
 *     summary: Create an event — organizers only
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EventInput' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event: { $ref: '#/components/schemas/EventDetail' }
 *       400: { description: Validation failed, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       403: { description: Not an organizer, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Venue not found, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post(
  '/',
  requireAuth,
  requireRole('organizer'),
  validate(createEventSchema),
  asyncHandler(eventController.create)
);

/**
 * @openapi
 * /events/{id}:
 *   put:
 *     tags: [Events]
 *     summary: Update an event — owner only
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EventInput' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event: { $ref: '#/components/schemas/EventDetail' }
 *       403:
 *         description: The event belongs to another organizer
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       409:
 *         description: Moving the event to a venue too small for the seats already sold
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('organizer'),
  validate(idParamSchema, 'params'),
  validate(updateEventSchema),
  asyncHandler(eventController.update)
);

/**
 * @openapi
 * /events/{id}:
 *   delete:
 *     tags: [Events]
 *     summary: Delete an event and its registrations — owner only
 *     description: >
 *       Removes the event, every registration attached to it, and its document
 *       in the search index.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       403:
 *         description: The event belongs to another organizer
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('organizer'),
  validate(idParamSchema, 'params'),
  asyncHandler(eventController.remove)
);

/**
 * @openapi
 * /events/{id}/register:
 *   post:
 *     tags: [Events]
 *     summary: Register the current user for an event
 *     description: >
 *       Refused when the event has reached the capacity of its venue. Seats are
 *       claimed with a conditional update inside a transaction, so two people
 *       competing for the last seat cannot both succeed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegistrationInput' }
 *     responses:
 *       201:
 *         description: Registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registration: { $ref: '#/components/schemas/Registration' }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Event not found, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       409:
 *         description: Already registered, or the venue is at capacity
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
 */
router.post(
  '/:id/register',
  requireAuth,
  validate(idParamSchema, 'params'),
  validate(registerForEventSchema),
  asyncHandler(eventController.register)
);

/**
 * @openapi
 * /events/{id}/register:
 *   delete:
 *     tags: [Events]
 *     summary: Cancel the current user's registration
 *     description: Releases the seats back to the event.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registration: { $ref: '#/components/schemas/Registration' }
 *       404:
 *         description: You are not registered for this event
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
 */
router.delete(
  '/:id/register',
  requireAuth,
  validate(idParamSchema, 'params'),
  asyncHandler(eventController.cancelRegistration)
);

/**
 * @openapi
 * /events/{id}/attendees:
 *   get:
 *     tags: [Events]
 *     summary: List the confirmed attendees — owner only
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: A page of attendees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Attendee' }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 total: { type: integer }
 *                 totalPages: { type: integer }
 *       403:
 *         description: The event belongs to another organizer
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get(
  '/:id/attendees',
  requireAuth,
  requireRole('organizer'),
  validate(idParamSchema, 'params'),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(eventController.attendees)
);

export default router;
