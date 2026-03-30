import { z } from 'zod';

// Schema for creating a listing
export const createListingSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional()
    .nullable(),
  price: z
    .number()
    .positive('Price must be greater than 0')
    .max(999999999, 'Price is too large'),
  region_id: z
    .number()
    .int()
    .positive('Invalid region'),
  category_id: z
    .number()
    .int()
    .positive('Invalid category'),
  contact: z
    .string()
    .min(5, 'Contact must be at least 5 characters')
    .max(200, 'Contact must be at most 200 characters'),
  image_url: z
    .string()
    .url('Invalid image URL')
    .optional()
    .nullable(),
});

// Schema for updating a listing
export const updateListingSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional()
    .nullable(),
  price: z
    .number()
    .positive('Price must be greater than 0')
    .max(999999999, 'Price is too large')
    .optional(),
  region_id: z
    .number()
    .int()
    .positive('Invalid region')
    .optional(),
  category_id: z
    .number()
    .int()
    .positive('Invalid category')
    .optional(),
  contact: z
    .string()
    .min(5, 'Contact must be at least 5 characters')
    .max(200, 'Contact must be at most 200 characters')
    .optional(),
  image_url: z
    .string()
    .url('Invalid image URL')
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
