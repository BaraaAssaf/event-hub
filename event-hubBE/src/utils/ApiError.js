
export class ApiError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || defaultCodeFor(statusCode);
    this.details = details;
  }

  static badRequest(message, opts) {
    return new ApiError(400, message, opts);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, message);
  }

  static conflict(message, opts) {
    return new ApiError(409, message, opts);
  }

  static unprocessable(message, opts) {
    return new ApiError(422, message, opts);
  }
}

function defaultCodeFor(statusCode) {
  const map = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
  };
  return map[statusCode] || 'INTERNAL_ERROR';
}
