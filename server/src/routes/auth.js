import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { signToken, requireAuth } from '../auth.js';
import { validate } from '../validate.js';

export const authRouter = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

/** POST /api/auth/login -> { token, user } */
authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      return res
        .status(401)
        .json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }
    const token = signToken(user);
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

/** GET /api/auth/me -> current user (requires Bearer token) */
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ email: req.user.email, role: req.user.role });
});
