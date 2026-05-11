import { z } from 'zod';

export const createOrderSchema = z.object({
  listing_id: z.string().uuid('Invalid listing ID'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'buyer_paid', 'delivered', 'completed', 'cancelled', 'disputed'], {
    errorMap: () => ({ message: 'Invalid status transition requested' }),
  }),
  dispute_reason: z.string().max(1000, 'Dispute reason is too long').optional(),
  payment_reference: z.string().max(255, 'Payment reference is too long').optional(),
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
