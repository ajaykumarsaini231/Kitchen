import { Router } from 'express';
import { z } from 'zod';
import { Dish } from '../models/Dish.js';
import { Order } from '../models/Order.js';
import { requireAuth, requireRole } from '../auth.js';
import { validate } from '../validate.js';
import { getIo } from '../io.js';

const TAX_RATE = 0.05;
const DELIVERY_FEE = 40;

export const ordersRouter = (() => {
  const router = Router();

  const createSchema = z.object({
    body: z.object({
      items: z
        .array(z.object({ dishId: z.string().min(1), qty: z.number().int().positive().max(50) }))
        .min(1),
      customer: z.object({
        name: z.string().min(1),
        phone: z.string().min(5),
        email: z.string().email().optional().or(z.literal('')),
        address: z.string().optional().or(z.literal('')),
      }),
      orderType: z.enum(['delivery', 'pickup', 'dine-in']),
      paymentMethod: z.enum(['cod', 'demo-card']),
    }),
  });

  // POST /api/orders (public) — place an order. Prices come from the DB.
  router.post('/', validate(createSchema), async (req, res, next) => {
    try {
      const { items, customer, orderType, paymentMethod } = req.body;

      const ids = items.map((i) => i.dishId);
      const dishes = await Dish.find({ dishId: { $in: ids }, deletedAt: null });
      const byId = new Map(dishes.map((d) => [d.dishId, d]));

      const lineItems = [];
      for (const i of items) {
        const dish = byId.get(i.dishId);
        if (!dish || !dish.isPublished) {
          return res
            .status(400)
            .json({ error: `Dish ${i.dishId} is unavailable`, code: 'ITEM_UNAVAILABLE' });
        }
        lineItems.push({
          dishId: dish.dishId,
          dishName: dish.dishName,
          price: dish.price,
          qty: i.qty,
        });
      }

      const subtotal = lineItems.reduce((s, li) => s + li.price * li.qty, 0);
      const tax = Math.round(subtotal * TAX_RATE);
      const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
      const total = subtotal + tax + deliveryFee;

      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const paymentStatus = paymentMethod === 'demo-card' ? 'paid' : 'pending';

      const order = await Order.create({
        orderNumber,
        items: lineItems,
        subtotal,
        tax,
        deliveryFee,
        total,
        customer,
        orderType,
        paymentMethod,
        paymentStatus,
        status: 'placed',
      });

      const io = getIo();
      if (io) io.emit('order:new', order.toClient());

      res.status(201).json(order.toClient());
    } catch (err) {
      next(err);
    }
  });

  // GET /api/orders (admin) — recent orders.
  router.get('/', requireAuth, requireRole('admin'), async (_req, res, next) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
      res.json(orders.map((o) => o.toClient()));
    } catch (err) {
      next(err);
    }
  });

  // GET /api/orders/:orderNumber (public) — order confirmation lookup.
  router.get('/:orderNumber', async (req, res, next) => {
    try {
      const order = await Order.findOne({ orderNumber: req.params.orderNumber });
      if (!order) return res.status(404).json({ error: 'Order not found', code: 'NOT_FOUND' });
      res.json(order.toClient());
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/orders/:orderNumber/status (admin)
  const statusSchema = z.object({
    params: z.object({ orderNumber: z.string().min(1) }),
    body: z.object({
      status: z.enum(['placed', 'preparing', 'ready', 'completed', 'cancelled']),
    }),
  });
  router.patch(
    '/:orderNumber/status',
    requireAuth,
    requireRole('admin'),
    validate(statusSchema),
    async (req, res, next) => {
      try {
        const order = await Order.findOneAndUpdate(
          { orderNumber: req.params.orderNumber },
          { $set: { status: req.body.status } },
          { new: true }
        );
        if (!order) return res.status(404).json({ error: 'Order not found', code: 'NOT_FOUND' });
        const io = getIo();
        if (io) io.emit('order:updated', order.toClient());
        res.json(order.toClient());
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
})();
