export const commonSchemas = {
  Error: {
    type: 'object',
    properties: {
      error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Validation failed' },
          code: { type: 'string', example: 'BAD_REQUEST' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email address' },
              },
            },
          },
        },
      },
    },
  },
};
