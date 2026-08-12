import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';
import { readTokenFromRequest } from '../utils/authCookie.js';

export function requireAuth(req, res, next) {
  const token = readTokenFromRequest(req);
  if (!token) {
    return next(ApiError.unauthorized('Missing or invalid authorization'));
  }

  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

export function optionalAuth(req, res, next) {
  const token = readTokenFromRequest(req);
  if (!token) {
    return next();
  }

  try {
    req.auth = verifyToken(token);
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
