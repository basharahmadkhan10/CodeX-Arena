import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, 
  standardHeaders: true,
  legacyHeaders: false, 
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  skipSuccessfulRequests: false, 
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, 
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  }
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 30, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded. Please slow down.'
  }
});
