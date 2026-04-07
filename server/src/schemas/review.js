import { z } from 'zod';

// Schema for creating a review
export const createReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z
    .string()
    .max(2000, 'Comment must be at most 2000 characters')
    .optional()
    .nullable(),
});

// Schema for updating a review
export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
  comment: z
    .string()
    .max(2000, 'Comment must be at most 2000 characters')
    .optional()
    .nullable(),
});

/**
 * Middleware factory to validate request body against a Zod schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error('Validation error details:', err.errors);
        return res.status(400).json({
          error: 'Validation error',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}
