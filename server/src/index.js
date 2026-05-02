import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import listingsRouter from './routes/listings.js';
import regionsRouter from './routes/regions.js';
import categoriesRouter from './routes/categories.js';
import reviewsRouter from './routes/reviews.js';
import reportsRouter from './routes/reports.js';
import adminRouter from './routes/admin.js';
import profileRouter from './routes/profile.js';
import ordersRouter from './routes/orders.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy to ensure rate limiting uses the correct IP behind Render
app.set('trust proxy', 1);

// Rate limiting configuration - 1000 requests per 15 minutes per IP globally
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    error: 'Too many requests, please try again later.',
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:4173', // Vite preview
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter); // Apply rate limiting to all API routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/listings', listingsRouter);
app.use('/api/regions', regionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api', reviewsRouter);
app.use('/api', reportsRouter);
app.use('/api', adminRouter);
app.use('/api', profileRouter);
app.use('/api/orders', ordersRouter);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Error:', err);

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.warn(`Server running on port ${PORT}`);
});

export default app;
