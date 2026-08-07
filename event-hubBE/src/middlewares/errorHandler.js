import { ApiError } from '../utils/ApiError.js';
import { isProd } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const code = isApiError ? err.code : 'INTERNAL_ERROR';

  if (!isApiError) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: {
      message: statusCode === 500 && isProd ? 'Internal server error' : err.message,
      code,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
