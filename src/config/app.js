const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const configureApp = (app) => {
  // View engine setup
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: process.env.NODE_ENV === 'production' 
          ? [
              "'self'",
              "'unsafe-inline'",
              "'nonce-landing-page'",
              "https://cdn.tailwindcss.com",
              "https://cdn.jsdelivr.net", 
              "https://cdnjs.cloudflare.com"
            ]
          : [
              "'self'",
              "'unsafe-inline'",
              "'unsafe-eval'",
              "'nonce-landing-page'",
              "https://cdn.tailwindcss.com",
              "https://cdn.jsdelivr.net", 
              "https://cdnjs.cloudflare.com"
            ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.gstatic.com"
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"]
      }
    }
  }));
  
  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }));
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 100,
    message: { error: 'Too many requests, please try again later' }
  });
  app.use('/api/', limiter);
  
  // Body parsing middleware
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    req.initialUrl = req.path;
    next();
  });
};

module.exports = { configureApp };