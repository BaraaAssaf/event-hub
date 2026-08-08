import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or invalid authorization header'));
  }

  const token = header.slice('Bearer '.length);
  try {
    req.auth = verifyToken(token);
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  try {
    req.auth = verifyToken(header.slice('Bearer '.length));
  } catch {
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
