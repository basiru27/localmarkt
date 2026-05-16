import { z } from 'zod';

const phoneRegex = /^(\+220|220)?\s?[2-9]\d{6}$/;

// Valid condition values
export const LISTING_CONDITIONS = ['new', 'used_like_new', 'used_good', 'used_fair'];

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
  condition: z
    .enum(LISTING_CONDITIONS, { errorMap: () => ({ message: 'Please select a valid condition' }) }),
  area_id: z
    .number()
    .int()
    .positive('Invalid area'),
  category_id: z
    .number()
    .int()
    .positive('Invalid category'),
  contact: z
    .string()
    .regex(phoneRegex, 'Must be a valid Gambian phone number'),
  image_url: z
    .string()
    .url('Invalid image URL')
    .optional()
    .nullable(),
  images: z
    .array(z.string().url('Invalid image URL'))
    .max(5, 'Maximum 5 images allowed')
    .optional()
    .nullable(),
  negotiable: z
    .boolean()
    .optional()
    .default(false),
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
  condition: z
    .enum(LISTING_CONDITIONS, { errorMap: () => ({ message: 'Please select a valid condition' }) })
    .optional(),
  area_id: z
    .number()
    .int()
    .positive('Invalid area')
    .optional(),
  category_id: z
    .number()
    .int()
    .positive('Invalid category')
    .optional(),
  contact: z
    .string()
    .regex(phoneRegex, 'Must be a valid Gambian phone number')
    .optional(),
  image_url: z
    .string()
    .url('Invalid image URL')
    .optional()
    .nullable(),
  images: z
    .array(z.string().url('Invalid image URL'))
    .max(5, 'Maximum 5 images allowed')
    .optional()
    .nullable(),
  negotiable: z
    .boolean()
    .optional(),
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
