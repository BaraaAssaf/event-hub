import { Router } from 'express';
import * as venueController from '../controllers/venue.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  createVenueSchema,
  updateVenueSchema,
  listVenuesQuerySchema,
} from '../validators/venue.validator.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Venues
 *     description: Places that host events
 */

/**
 * @openapi
 * /venues:
 *   get:
 *     tags: [Venues]
 *     summary: List venues
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: A page of venues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Venue' }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 total: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get('/', validate(listVenuesQuerySchema, 'query'), asyncHandler(venueController.list));

/**
 * @openapi
 * /venues/{id}:
 *   get:
 *     tags: [Venues]
 *     summary: Get one venue
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The venue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 venue: { $ref: '#/components/schemas/Venue' }
 *       400: { description: Malformed id, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(venueController.getOne));

/**
 * @openapi
 * /venues:
 *   post:
 *     tags: [Venues]
 *     summary: Create a venue — organizers only
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VenueInput' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 venue: { $ref: '#/components/schemas/Venue' }
 *       400: { description: Validation failed, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       403: { description: Not an organizer, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post(
  '/',
  requireAuth,
  requireRole('organizer'),
  validate(createVenueSchema),
  asyncHandler(venueController.create)
);

/**
 * @openapi
 * /venues/{id}:
 *   put:
 *     tags: [Venues]
 *     summary: Update a venue — organizers only
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
 *           schema: { $ref: '#/components/schemas/VenueInput' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 venue: { $ref: '#/components/schemas/Venue' }
 *       403: { description: Not an organizer, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('organizer'),
  validate(idParamSchema, 'params'),
  validate(updateVenueSchema),
  asyncHandler(venueController.update)
);

/**
 * @openapi
 * /venues/{id}:
 *   delete:
 *     tags: [Venues]
 *     summary: Delete a venue — organizers only, and only if it has no upcoming events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       403: { description: Not an organizer, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       409:
 *         description: The venue still hosts upcoming events
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('organizer'),
  validate(idParamSchema, 'params'),
  asyncHandler(venueController.remove)
);

export default router;
