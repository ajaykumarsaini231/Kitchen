// Hand-authored OpenAPI 3.0 spec served at /api/docs.
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Dish Dashboard API',
    version: '1.0.0',
    description:
      'API for managing dishes with JWT auth, roles, and real-time updates. ' +
      'All routes are also available under /api/v1.',
  },
  servers: [{ url: 'http://localhost:4000' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Dish: {
        type: 'object',
        properties: {
          dishId: { type: 'string', example: '1' },
          dishName: { type: 'string', example: 'Margherita Pizza' },
          imageUrl: { type: 'string' },
          isPublished: { type: 'boolean' },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' }, code: { type: 'string' } },
      },
    },
  },
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Log in, returns a JWT + user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/api/dishes': {
      get: {
        summary: 'List dishes (public)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['dishId', 'dishName', 'isPublished', 'createdAt'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'published', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Array of dishes',
            content: {
              'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Dish' } } },
            },
          },
        },
      },
      post: {
        summary: 'Create a dish (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dishName'],
                properties: {
                  dishId: { type: 'string' },
                  dishName: { type: 'string' },
                  imageUrl: { type: 'string' },
                  isPublished: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' }, 401: { description: 'Unauthenticated' }, 403: { description: 'Forbidden' } },
      },
    },
    '/api/dishes/{dishId}/toggle': {
      patch: {
        summary: 'Toggle isPublished (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'dishId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated dish' }, 404: { description: 'Not found' } },
      },
    },
    '/api/dishes/{dishId}': {
      get: {
        summary: 'Get a single dish (public)',
        parameters: [{ name: 'dishId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Dish',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Dish' } } },
          },
          404: { description: 'Not found' },
        },
      },
      put: {
        summary: 'Update a dish (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'dishId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated dish' }, 404: { description: 'Not found' } },
      },
      patch: {
        summary: 'Set isPublished (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'dishId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated dish' }, 404: { description: 'Not found' } },
      },
      delete: {
        summary: 'Soft-delete a dish (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'dishId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' }, 404: { description: 'Not found' } },
      },
    },
    '/api/dishes/{dishId}/simulate-external': {
      post: {
        summary: 'Demo: out-of-band flip (public)',
        parameters: [{ name: 'dishId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated dish' }, 404: { description: 'Not found' } },
      },
    },
    '/api/health': { get: { summary: 'Liveness', responses: { 200: { description: 'OK' } } } },
    '/api/ready': { get: { summary: 'Readiness', responses: { 200: { description: 'OK' } } } },
  },
};
