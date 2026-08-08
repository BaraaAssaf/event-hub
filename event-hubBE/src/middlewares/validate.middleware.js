import { ApiError } from '../utils/ApiError.js';


export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.badRequest('Validation failed', { details }));
    }
    if (source === 'query') {
      Object.keys(req.query).forEach((key) => delete req.query[key]);
      Object.assign(req.query, result.data);
    } else {
      req[source] = result.data;
    }
    next();
  };
}
