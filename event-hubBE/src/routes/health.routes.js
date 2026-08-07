import { Router } from 'express';
import mongoose from 'mongoose';
import { esStatus } from '../config/es.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Health
 *     description: Service status
 */

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Check API, MongoDB and Elasticsearch status
 *     responses:
 *       200:
 *         description: Current service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 mongo: { type: string, example: connected }
 *                 elasticsearch: { type: string, example: connected }
 */
router.get('/health', (req, res) => {
  const mongoState = mongoose.connection.readyState; // 1 = connected
  res.json({
    status: 'ok',
    mongo: mongoState === 1 ? 'connected' : 'disconnected',
    elasticsearch: esStatus.available ? 'connected' : 'unavailable',
  });
});

export default router;
