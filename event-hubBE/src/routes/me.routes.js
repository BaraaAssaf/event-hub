import { Router } from 'express';
import * as meController from '../controllers/me.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listRegistrationsQuerySchema } from '../validators/event.validator.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Me
 *     description: The current user's registrations and organizer dashboard
 */

/**
 * @openapi
 * /me/registrations:
 *   get:
 *     tags: [Me]
 *     summary: The current user's registrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [confirmed, cancelled] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: A page of registrations, each with its event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/RegistrationWithEvent' }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 total: { type: integer }
 *                 totalPages: { type: integer }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get(
  '/registrations',
  requireAuth,
  validate(listRegistrationsQuerySchema, 'query'),
  asyncHandler(meController.registrations)
);

/**
 * @openapi
 * /me/events:
 *   get:
 *     tags: [Me]
 *     summary: Organizer dashboard — my events with registration counts and remaining seats
 *     description: Built with an aggregation pipeline, not a find plus per-event counts.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Every event I organize
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/OrganizerEvent' }
 *                 total: { type: integer }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       403: { description: Not an organizer, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get(
  '/events',
  requireAuth,
  requireRole('organizer'),
  asyncHandler(meController.events)
);

export default router;
