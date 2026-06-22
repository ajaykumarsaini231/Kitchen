import { Router } from 'express';
import { z } from 'zod';
import { Reservation } from '../models/Reservation.js';
import { requireAuth, requireRole } from '../auth.js';
import { validate } from '../validate.js';
import { getIo } from '../io.js';

export const reservationsRouter = Router();

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    phone: z.string().min(5),
    email: z.string().email().optional().or(z.literal('')),
    date: z.string().min(1),
    time: z.string().min(1),
    partySize: z.number().int().positive().max(50),
    notes: z.string().optional().or(z.literal('')),
  }),
});

// POST /api/reservations (public) — book a table.
reservationsRouter.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const reservation = await Reservation.create(req.body);
    const io = getIo();
    if (io) io.emit('reservation:new', reservation.toClient());
    res.status(201).json(reservation.toClient());
  } catch (err) {
    next(err);
  }
});

// GET /api/reservations (admin)
reservationsRouter.get('/', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const list = await Reservation.find().sort({ createdAt: -1 }).limit(100);
    res.json(list.map((r) => r.toClient()));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reservations/:id/status (admin)
const statusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(['requested', 'confirmed', 'cancelled']) }),
});
reservationsRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin'),
  validate(statusSchema),
  async (req, res, next) => {
    try {
      const r = await Reservation.findByIdAndUpdate(
        req.params.id,
        { $set: { status: req.body.status } },
        { new: true }
      );
      if (!r) return res.status(404).json({ error: 'Reservation not found', code: 'NOT_FOUND' });
      res.json(r.toClient());
    } catch (err) {
      next(err);
    }
  }
);
