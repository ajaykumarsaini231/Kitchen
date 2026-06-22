import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { logger } from './logger.js';

/**
 * Seed an admin and a viewer account from env vars (idempotent).
 * Defaults are provided so the app works out of the box for reviewers.
 */
export async function ensureUsersSeeded() {
  const defs = [
    {
      email: process.env.ADMIN_EMAIL || 'admin@metnmat.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
    },
    {
      email: process.env.VIEWER_EMAIL || 'viewer@metnmat.com',
      password: process.env.VIEWER_PASSWORD || 'viewer123',
      role: 'viewer',
    },
  ];

  for (const d of defs) {
    const email = d.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (!existing) {
      const passwordHash = await bcrypt.hash(d.password, 10);
      await User.create({ email, passwordHash, role: d.role });
      logger.info({ email, role: d.role }, '[seed] created user');
    }
  }
}
