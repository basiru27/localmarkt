import { supabase } from '../supabase.js';

/**
 * Middleware to verify JWT token
 * Sets req.user with decoded token payload if valid
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('JWT verification failed:', error?.name, '-', error?.message);
      return res.status(401).json({ error: 'Invalid token. Please sign in again.' });
    }

    const appMetadata = user.app_metadata || {};
    const role = appMetadata.role || 'user';
    const isBanned = appMetadata.is_banned === true;

    if (isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: role,
      is_banned: isBanned,
      isAdmin: role === 'admin' || role === 'super_admin',
      isSuperAdmin: role === 'super_admin',
    };
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.name, '-', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please sign in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't block if missing
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (user && !error) {
      const appMetadata = user.app_metadata || {};
      const role = appMetadata.role || 'user';
      const isBanned = appMetadata.is_banned === true;

      if (isBanned) {
        req.user = null;
        return next();
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: role,
        is_banned: isBanned,
        isAdmin: role === 'admin' || role === 'super_admin',
        isSuperAdmin: role === 'super_admin',
      };
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }

  next();
}
