import { Router } from 'express';
import { supabase } from '../supabase.js';
import { authenticate } from '../middleware/auth.js';
import { createOrderSchema, updateOrderStatusSchema, validateBody } from '../schemas/order.js';

const router = Router();

// Apply auth middleware to all order routes
router.use(authenticate);

/**
 * @route POST /api/orders
 * @desc Creates a new order. Validates listing_id is approved. Snapshots current price.
 */
router.post('/', validateBody(createOrderSchema), async (req, res) => {
  const { listing_id } = req.body;
  const buyer_id = req.user.id;

  try {
    // 1. Fetch the listing to validate it exists, is approved, and isn't owned by the buyer
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, price, moderation_status')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.moderation_status !== 'approved') {
      return res.status(400).json({ error: 'Cannot purchase an unapproved listing' });
    }

    if (listing.user_id === buyer_id) {
      return res.status(400).json({ error: 'You cannot purchase your own listing' });
    }

    // 2. Create the order
    // A partial unique index (one_active_order_per_listing) prevents multiple active orders per listing.
    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert({
        buyer_id,
        seller_id: listing.user_id,
        listing_id: listing.id,
        price_at_purchase: listing.price,
        status: 'pending',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours from now
      })
      .select()
      .single();

    if (insertError) {
      // 23505 is PostgreSQL unique_violation code
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'This listing is already in an active transaction' });
      }
      throw insertError;
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * @route GET /api/orders/purchases
 * @desc Fetches orders where auth.uid() === buyer_id
 */
router.get('/purchases', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        listing:listings(id, title, image_url)
      `)
      .eq('buyer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch sellers manually since PostgREST cannot resolve dual FKs to auth.users
    const sellerIds = [...new Set(orders.map(o => o.seller_id))];
    let profilesMap = {};
    
    if (sellerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, phone_number, avatar_url')
        .in('id', sellerIds);
        
      if (profiles) {
        profilesMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      }
    }

    const data = orders.map(o => ({
      ...o,
      seller: profilesMap[o.seller_id] || null
    }));

    res.json({ data });
  } catch (error) {
    console.error('Fetch purchases error:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

/**
 * @route GET /api/orders/sales
 * @desc Fetches orders where auth.uid() === seller_id
 */
router.get('/sales', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        listing:listings(id, title, image_url)
      `)
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch buyers manually since PostgREST cannot resolve dual FKs to auth.users
    const buyerIds = [...new Set(orders.map(o => o.buyer_id))];
    let profilesMap = {};
    
    if (buyerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, phone_number, avatar_url')
        .in('id', buyerIds);
        
      if (profiles) {
        profilesMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      }
    }

    const data = orders.map(o => ({
      ...o,
      buyer: profilesMap[o.buyer_id] || null
    }));

    res.json({ data });
  } catch (error) {
    console.error('Fetch sales error:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

/**
 * @route PUT /api/orders/:id/status
 * @desc Updates status. Strictly enforces state machine rules.
 */
router.put('/:id/status', validateBody(updateOrderStatusSchema), async (req, res) => {
  const { id } = req.params;
  const { status: newStatus, dispute_reason, payment_reference } = req.body;
  const userId = req.user.id;
  const isAdmin = req.user.isAdmin || req.user.isSuperAdmin;

  try {
    // 1. Fetch current order state
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const isBuyer = order.buyer_id === userId;
    const isSeller = order.seller_id === userId;

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to modify this order' });
    }

    // 2. State Machine Enforcement
    const currentStatus = order.status;
    let isValidTransition = false;
    let errorMessage = 'Invalid status transition requested';

    if (newStatus === 'disputed') {
      if (!['pending', 'buyer_paid'].includes(currentStatus)) {
        return res.status(409).json({ error: 'Cannot dispute an order that is already completed or cancelled' });
      }
      // Any party (buyer or seller) can dispute
      if (isBuyer || isSeller) {
        isValidTransition = true;
      } else {
        errorMessage = 'Only the buyer or seller can open a dispute';
      }
    } else if (currentStatus === 'pending') {
      if (newStatus === 'buyer_paid') {
        if (isBuyer) isValidTransition = true;
        else errorMessage = 'Only the buyer can mark an order as paid';
      } else if (newStatus === 'cancelled') {
        if (isBuyer) isValidTransition = true;
        else errorMessage = 'Only the buyer can cancel a pending order';
      }
    } else if (currentStatus === 'buyer_paid') {
      if (newStatus === 'completed') {
        if (isSeller) isValidTransition = true;
        else errorMessage = 'Only the seller can mark an order as completed';
      } else if (newStatus === 'delivered') {
        if (isSeller) isValidTransition = true;
        else errorMessage = 'Only the seller can mark an order as delivered';
      }
    } else if (currentStatus === 'delivered') {
      if (newStatus === 'completed') {
        if (isSeller || isBuyer) isValidTransition = true;
        else errorMessage = 'Only the buyer or seller can complete a delivered order';
      }
    } else if (currentStatus === 'disputed') {
      if (newStatus === 'completed' || newStatus === 'cancelled') {
        if (isAdmin) isValidTransition = true;
        else errorMessage = 'Only administrators can resolve disputes';
      }
    }

    if (!isValidTransition) {
      return res.status(409).json({ error: errorMessage });
    }

    // 3. Perform the update
    const updatePayload = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    }

    if (newStatus === 'disputed' && dispute_reason) {
      updatePayload.dispute_reason = dispute_reason;
    }

    if (newStatus === 'buyer_paid' && payment_reference) {
      updatePayload.payment_reference = payment_reference;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
