import { Router } from 'express';
import { z } from 'zod';
import { Dish } from '../models/Dish.js';
import { requireAuth, requireRole } from '../auth.js';
import { validate } from '../validate.js';

export const dishesRouter = Router();

const dishIdParam = z.object({ params: z.object({ dishId: z.string().min(1) }) });
const setPublishedSchema = z.object({
  params: z.object({ dishId: z.string().min(1) }),
  body: z.object({ isPublished: z.boolean() }),
});
const createSchema = z.object({
  body: z.object({
    dishId: z.string().min(1).optional(),
    dishName: z.string().min(1),
    imageUrl: z.string().url().optional().or(z.literal('')),
    description: z.string().optional().or(z.literal('')),
    isPublished: z.boolean().optional(),
    price: z.number().min(0).optional(),
  }),
});
const updateSchema = z.object({
  params: z.object({ dishId: z.string().min(1) }),
  body: z
    .object({
      dishName: z.string().min(1).optional(),
      imageUrl: z.string().url().optional().or(z.literal('')),
      description: z.string().optional().or(z.literal('')),
      isPublished: z.boolean().optional(),
      price: z.number().min(0).optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'At least one field required' }),
});
const listSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sort: z.enum(['dishId', 'dishName', 'isPublished', 'createdAt']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    published: z.enum(['true', 'false']).optional(),
    q: z.string().optional(),
  }),
});

const adminOnly = [requireAuth, requireRole('admin')];
const NOT_DELETED = { deletedAt: null };

/**
 * GET /api/dishes  (public)
 * Returns an array of (non-deleted) dishes. Back-compatible: with no query
 * params it returns ALL dishes. Opt-in pagination/sorting/filtering:
 *   ?page=&limit=&sort=dishId|dishName|isPublished|createdAt&order=asc|desc
 *   ?published=true|false&q=<name search>
 * When ?limit is given, an X-Total-Count header carries the unpaged total.
 */
dishesRouter.get('/', validate(listSchema), async (req, res, next) => {
  try {
    const { page, limit, sort = 'dishId', order = 'asc', published, q } = req.query;

    const filter = { ...NOT_DELETED };
    if (published === 'true') filter.isPublished = true;
    if (published === 'false') filter.isPublished = false;
    if (q) filter.dishName = { $regex: q, $options: 'i' };

    const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
    const cursor = Dish.find(filter).sort(sortObj);

    if (limit) {
      const l = Number(limit);
      const p = Number(page) || 1;
      const total = await Dish.countDocuments(filter);
      const docs = await cursor.skip((p - 1) * l).limit(l);
      res.set('X-Total-Count', String(total));
      return res.json(docs.map((d) => d.toClient()));
    }

    const docs = await cursor;
    res.json(docs.map((d) => d.toClient()));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dishes/:dishId  (public)
 * Single non-deleted dish, or 404. Used by the public menu detail page.
 */
dishesRouter.get('/:dishId', validate(dishIdParam), async (req, res, next) => {
  try {
    const dish = await Dish.findOne({ dishId: req.params.dishId, ...NOT_DELETED });
    if (!dish) {
      return res.status(404).json({ error: 'Dish not found', code: 'NOT_FOUND' });
    }
    res.json(dish.toClient());
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/dishes  (admin)
 * Create a dish. dishId is auto-generated (max numeric + 1) if omitted.
 */
dishesRouter.post('/', ...adminOnly, validate(createSchema), async (req, res, next) => {
  try {
    let { dishId } = req.body;
    const { dishName, imageUrl = '', description = '', isPublished = false, price = 0 } = req.body;

    if (!dishId) {
      const ids = await Dish.find({}, 'dishId').lean();
      const max = ids.reduce((m, d) => Math.max(m, Number(d.dishId) || 0), 0);
      dishId = String(max + 1);
    } else {
      const exists = await Dish.findOne({ dishId });
      if (exists) {
        return res.status(409).json({ error: 'dishId already exists', code: 'CONFLICT' });
      }
    }

    const dish = await Dish.create({ dishId, dishName, imageUrl, description, isPublished, price });
    res.status(201).json(dish.toClient());
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/dishes/:dishId/toggle  (admin)
 * Atomically flip isPublished (no read-then-write race).
 */
dishesRouter.patch('/:dishId/toggle', ...adminOnly, validate(dishIdParam), async (req, res, next) => {
  try {
    const updated = await Dish.findOneAndUpdate(
      { dishId: req.params.dishId, ...NOT_DELETED },
      [{ $set: { isPublished: { $not: '$isPublished' } } }],
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Dish not found', code: 'NOT_FOUND' });
    }
    res.json(updated.toClient());
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/dishes/:dishId/simulate-external  (public)
 * Demo helper: flips isPublished via a direct DB write to mimic an out-of-band
 * backend change. The dashboard reacts via the change stream.
 */
dishesRouter.post('/:dishId/simulate-external', validate(dishIdParam), async (req, res, next) => {
  try {
    const updated = await Dish.findOneAndUpdate(
      { dishId: req.params.dishId, ...NOT_DELETED },
      [{ $set: { isPublished: { $not: '$isPublished' } } }],
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Dish not found', code: 'NOT_FOUND' });
    }
    res.json(updated.toClient());
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/dishes/:dishId  (admin)
 * Update one or more of dishName / imageUrl / isPublished.
 */
dishesRouter.put('/:dishId', ...adminOnly, validate(updateSchema), async (req, res, next) => {
  try {
    const updated = await Dish.findOneAndUpdate(
      { dishId: req.params.dishId, ...NOT_DELETED },
      { $set: req.body },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Dish not found', code: 'NOT_FOUND' });
    }
    res.json(updated.toClient());
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/dishes/:dishId  (admin)
 * Explicitly set isPublished. Body: { "isPublished": boolean }
 */
dishesRouter.patch('/:dishId', ...adminOnly, validate(setPublishedSchema), async (req, res, next) => {
  try {
    const updated = await Dish.findOneAndUpdate(
      { dishId: req.params.dishId, ...NOT_DELETED },
      { $set: { isPublished: req.body.isPublished } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Dish not found', code: 'NOT_FOUND' });
    }
    res.json(updated.toClient());
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/dishes/:dishId  (admin)
 * Soft delete (sets deletedAt). The dish disappears from listings; the
 * dashboard resyncs via the change stream.
 */
dishesRouter.delete('/:dishId', ...adminOnly, validate(dishIdParam), async (req, res, next) => {
  try {
    const updated = await Dish.findOneAndUpdate(
      { dishId: req.params.dishId, ...NOT_DELETED },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Dish not found', code: 'NOT_FOUND' });
    }
    res.json({ ok: true, dishId: req.params.dishId });
  } catch (err) {
    next(err);
  }
});
