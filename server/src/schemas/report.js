import { z } from 'zod';

export const createReportSchema = z
  .object({
    listing_id: z.string().uuid().optional(),
    reported_user_id: z.string().uuid().optional(),
    reason: z
      .string()
      .trim()
      .min(3, 'Reason must be at least 3 characters')
      .max(120, 'Reason must be at most 120 characters'),
    details: z
      .string()
      .trim()
      .max(2000, 'Details must be at most 2000 characters')
      .optional()
      .nullable(),
  })
  .refine((data) => !!data.listing_id || !!data.reported_user_id, {
    message: 'You must report either a listing or a user',
    path: ['listing_id'],
  });

export const updateReportStatusSchema = z.object({
  status: z.enum(['pending', 'resolved', 'dismissed']),
});

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: err.errors.map((entry) => ({
            field: entry.path.join('.'),
            message: entry.message,
          })),
        });
      }

      next(err);
    }
  };
}
