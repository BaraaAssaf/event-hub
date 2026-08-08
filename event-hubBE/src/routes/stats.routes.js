import { Router } from 'express';
import * as statsController from '../controllers/stats.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Stats
 *     description: Aggregated reporting
 */

/**
 * @openapi
 * /stats/top-venues:
 *   get:
 *     tags: [Stats]
 *     summary: The top 5 venues by number of confirmed registrations
 *     description: Built with an aggregation pipeline over the registrations collection.
 *     responses:
 *       200:
 *         description: Up to five venues, most registrations first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/TopVenue' }
 */
router.get('/top-venues', asyncHandler(statsController.topVenues));

export default router;
