import { z } from 'zod';

export const updateBanStatusSchema = z.object({
  is_banned: z.boolean(),
  reason: z
    .string()
    .trim()
    .max(500, 'Reason must be at most 500 characters')
    .optional()
    .nullable(),
});

export const moderateListingSchema = z.object({
  moderation_status: z.enum(['approved', 'rejected']),
  moderation_note: z
    .string()
    .trim()
    .max(1000, 'Moderation note must be at most 1000 characters')
    .optional()
    .nullable(),
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
