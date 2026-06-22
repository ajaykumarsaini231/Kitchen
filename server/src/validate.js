/**
 * Zod validation middleware. Pass a schema shaped like
 *   z.object({ body: ..., params: ..., query: ... })
 * Any provided sub-schema is validated; parsed (coerced) values are written back.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    if (result.data.params) Object.assign(req.params, result.data.params);
    if (result.data.query) Object.assign(req.query, result.data.query);
    if (result.data.body !== undefined) req.body = result.data.body;
    next();
  };
}
