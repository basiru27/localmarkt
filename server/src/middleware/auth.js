import jwt from 'jsonwebtoken';

const JWT_SECRET_BASE64 = process.env.SUPABASE_JWT_SECRET;

if (!JWT_SECRET_BASE64) {
  console.warn('Warning: SUPABASE_JWT_SECRET not set');
}

// Decode the base64 secret - Supabase JWT secrets are base64-encoded
const JWT_SECRET = JWT_SECRET_BASE64 
  ? Buffer.from(JWT_SECRET_BASE64, 'base64')
  : null;

/**
 * Middleware to verify JWT token
 * Sets req.user with decoded token payload if valid
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  if (!JWT_SECRET) {
    console.error('SUPABASE_JWT_SECRET is not configured');
    return res.status(500).json({ error: 'Server authentication not configured' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
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
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (err) {
    req.user = null;
  }

  next();
}

/**
 * Middleware to verify JWT token
 * Sets req.user with decoded token payload if valid
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  if (!JWT_SECRET) {
    console.error('SUPABASE_JWT_SECRET is not configured');
    return res.status(500).json({ error: 'Server authentication not configured' });
  }

  try {
    // Try to decode without verification first to see what's in the token
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    // Log detailed error info
    console.error('JWT verification failed:', err.name, '-', err.message);
    
    // Try decoding without verification to see token contents
    try {
      const unverified = jwt.decode(token);
      console.error('Token payload (unverified):', JSON.stringify(unverified, null, 2));
    } catch (decodeErr) {
      console.error('Could not decode token at all');
    }
    
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
 * Middleware to verify JWT token
 * Sets req.user with decoded token payload if valid
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  if (!JWT_SECRET) {
    console.error('SUPABASE_JWT_SECRET is not configured');
    return res.status(500).json({ error: 'Server authentication not configured' });
  }

  // Debug: decode without verification to see token structure
  const decoded_unverified = jwt.decode(token, { complete: true });
  console.log('Token header:', decoded_unverified?.header);
  console.log('Token payload sub:', decoded_unverified?.payload?.sub);
  console.log('Token payload iss:', decoded_unverified?.payload?.iss);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
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
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (err) {
    req.user = null;
  }

  next();
}
