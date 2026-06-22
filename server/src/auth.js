import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES = process.env.JWT_EXPIRES || '7d';

export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, role: user.role },
    SECRET,
    { expiresIn: EXPIRES }
  );
}

/** Require a valid Bearer token; attaches { sub, email, role } to req.user. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res
      .status(401)
      .json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res
      .status(401)
      .json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
}

/** Require req.user to have a specific role (use after requireAuth). */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
    }
    if (req.user.role !== role) {
      return res
        .status(403)
        .json({ error: `Requires ${role} role`, code: 'FORBIDDEN' });
    }
    next();
  };
}
