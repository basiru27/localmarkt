import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters').max(50).optional(),
  phone_number: z.string().regex(/^\+220\d{7}$/, 'Enter a valid Gambian number (+220 followed by 7 digits)').optional(),
  bio: z.string().max(500).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  notifications: z.record(z.boolean()).optional(),
});

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};
