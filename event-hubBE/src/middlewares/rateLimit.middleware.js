import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

function handler(req, res, next) {
  next(new ApiError(429, 'Too many requests, please try again later', { code: 'RATE_LIMITED' }));
}

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});


export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler,
});
