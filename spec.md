# NodeJS MSaaS (Micro SaaS) Boilerplate Specification

## Overview
A production-ready Node.js boilerplate for building Micro SaaS applications with native MongoDB driver integration and Stripe payment processing. Designed for rapid development while maintaining security, scalability, and best practices.

## Core Architecture

### Technology Stack
- **Runtime**: Node.js 18+ (LTS)
- **Database**: MongoDB with native driver (mongodb npm package)
- **Payment Processing**: Stripe (stripe npm package)
- **Web Framework**: Express.js
- **Authentication**: JWT with refresh tokens
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston with structured logging
- **Environment Management**: dotenv
- **Process Management**: PM2 for production

### Project Structure
```
msaas-boilerplate/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   ├── stripe.js            # Stripe configuration
│   │   ├── jwt.js               # JWT settings
│   │   └── app.js               # App configuration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── subscription.controller.js
│   │   └── webhook.controller.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── subscription.model.js
│   │   └── payment.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── subscription.routes.js
│   │   └── webhook.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── stripe.service.js
│   │   ├── email.service.js
│   │   └── subscription.service.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── crypto.js
│   │   └── validators.js
│   └── index.js                 # Entry point
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Database Layer (Native MongoDB)

### Connection Management
- **Singleton Pattern**: Single MongoDB connection instance
- **Connection Pooling**: Configurable pool size
- **Auto-reconnection**: Handle connection drops gracefully
- **Health Checks**: Database connectivity monitoring
- **Read Preferences**: Support for read replicas

### Collections & Schemas

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  passwordHash: String (bcrypt),
  firstName: String,
  lastName: String,
  stripeCustomerId: String,
  subscription: {
    status: String ['active', 'canceled', 'past_due', 'incomplete'],
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    planId: String,
    subscriptionId: String
  },
  metadata: {
    createdAt: Date,
    updatedAt: Date,
    lastLogin: Date,
    loginCount: Number
  }
}
```

#### Subscriptions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  stripeSubscriptionId: String (unique),
  stripePriceId: String,
  status: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  metadata: {
    createdAt: Date,
    updatedAt: Date
  }
}
```

#### Payments Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  stripePaymentIntentId: String,
  amount: Number,
  currency: String,
  status: String,
  description: String,
  metadata: {
    createdAt: Date,
    updatedAt: Date
  }
}
```

### Database Operations
- **CRUD Operations**: Generic repository pattern
- **Indexes**: Optimized for common queries
- **Transactions**: Multi-document transactions support
- **Aggregation Pipelines**: For analytics and reporting
- **Change Streams**: Real-time data synchronization

## Stripe Integration

### Configuration
- **API Keys**: Secure storage in environment variables
- **Webhook Endpoints**: Secure webhook handling
- **Test Mode**: Separate test/live environment configs
- **Stripe SDK**: Official stripe npm package

### Payment Features
- **Subscription Management**: Create, update, cancel subscriptions
- **Multiple Plans**: Support for tiered pricing
- **Trial Periods**: Configurable trial periods
- **Proration**: Handle plan changes and upgrades
- **Payment Methods**: Credit cards, digital wallets
- **Invoices**: Automatic invoice generation
- **Tax Rates**: Support for tax calculation

### Webhook Handling
- **Event Types**: subscription.updated, invoice.payment_succeeded, invoice.payment_failed
- **Security**: Webhook signature verification
- **Idempotency**: Prevent duplicate processing
- **Error Handling**: Graceful failure handling
- **Retry Logic**: Failed webhook processing

### Stripe Objects Sync
- **Customers**: Sync with user accounts
- **Subscriptions**: Track subscription status
- **Invoices**: Store payment history
- **Payment Methods**: Secure storage of payment methods

## Authentication & User Management

### JWT Implementation

Keep it simple for the POC/MVP

- **Access Tokens**: Short-lived (15 minutes)
- **Refresh Tokens**: Long-lived (7 days)
- **Token Storage**: httpOnly cookies + secure headers
- **Token Rotation**: Refresh token rotation on use
- **Revocation**: Token blacklisting capability (Planned) (Not implemented in POC/MVP)

### User Registration Flow
1. Email validation
2. Password strength requirements
3. Email verification
4. Stripe customer creation
5. Welcome email

### Password Management
- **Hashing**: bcrypt with salt rounds
- **Reset Flow**: Secure token-based reset
- **Strength Validation**: Enforce strong passwords (Planned) (Not implemented in POC/MVP)
- **History**: Prevent password reuse (Planned) (Not implemented in POC/MVP)

## API Design

### RESTful Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

#### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/account` - Delete account

#### Subscriptions
- `GET /api/subscriptions/plans` - Get available plans
- `POST /api/subscriptions/create` - Create subscription
- `PUT /api/subscriptions/update` - Update subscription
- `DELETE /api/subscriptions/cancel` - Cancel subscription
- `GET /api/subscriptions/status` - Get subscription status

#### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook endpoint

### API Standards
- **Versioning**: URL-based versioning (/api/v1/)
- **Response Format**: Consistent JSON structure
- **Error Handling**: Standardized error responses
- **Rate Limiting**: Per-endpoint rate limits
- **Pagination**: Cursor-based pagination
- **Filtering**: Query parameter filtering
- **Sorting**: Field-based sorting

### Response Format
```javascript
{
  success: Boolean,
  data: Object | Array,
  message: String,
  errors: Array,
  meta: {
    timestamp: Date,
    version: String,
    requestId: String
  }
}
```

## Security Implementation

### Security Headers
- **Helmet.js**: Comprehensive security headers
- **CORS**: Configurable CORS policies
- **Content Security Policy**: XSS protection
- **HSTS**: HTTP Strict Transport Security

### Input Validation
- **Express-validator**: Request validation
- **XSS Protection**: Input sanitization
- **File Upload**: Size limits and type validation

### Rate Limiting (Planned)

Not implemented in POC/MVP

- **Express-rate-limit**: Request rate limiting
- **Redis**: Distributed rate limiting
- **Per-endpoint limits**: Different limits per endpoint
- **IP-based tracking**: Track by IP address

### Data Protection
- **Encryption**: Sensitive data encryption at rest
- **HTTPS**: Enforce HTTPS in production
- **Secure Cookies**: httpOnly, secure, sameSite
- **Data Masking**: PII masking in logs

## Error Handling & Logging

### Error Handling
- **Centralized Handler**: Global error handler
- **Custom Error Classes**: Specific error types
- **HTTP Status Codes**: Proper status codes
- **Error Messages**: User-friendly messages
- **Stack Traces**: Development vs production

### Logging
- **Winston**: Structured logging
- **Log Levels**: error, warn, info, debug
- **Log Rotation**: Daily log rotation
- **External Services**: Log aggregation (optional)
- **Sensitive Data**: Automatic redaction

### Monitoring
- **Health Checks**: /health endpoint
- **Metrics**: Response times, error rates
- **Uptime Monitoring**: Service availability
- **Database Monitoring**: Connection health

## Email Service

### Email Templates
- **Welcome Email**: New user registration
- **Password Reset**: Reset password flow
- **Subscription Confirmation**: Payment confirmations
- **Failed Payment**: Payment failure notifications
- **Trial Ending**: Trial expiration reminders

### Email Providers
- **SMTP**: Primary email service
- **Fallback**: Secondary provider configuration (Planned) (Not implemented in POC/MVP)
- **Queue System**: Background email processing (Planned) (Not implemented in POC/MVP)
- **Templates**: HTML email templates (Planned) (Not implemented in POC/MVP)

## Testing Strategy

### Test Types
- **Unit Tests**: Service layer testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: MongoDB operations
- **Stripe Tests**: Mock Stripe interactions
- **Load Tests**: Performance testing

### Test Structure
- **Jest**: Testing framework
- **Supertest**: API testing
- **MongoDB Memory Server**: In-memory testing
- **Test Fixtures**: Mock data generation
- **Coverage**: 80%+ code coverage target

## Deployment & DevOps

### Environment Configuration
- **Development**: Local development setup
- **Staging**: Pre-production testing
- **Production**: Live environment
- **Feature Flags**: Gradual rollouts

### Docker Configuration
```dockerfile
# Multi-stage build
FROM node:20.17.0-alpine AS builder
FROM node:20.17.0-alpine AS production
```

### CI/CD Pipeline
- **GitHub Actions**: Automated testing
- **Docker Build**: Containerized deployment
- **Database Migrations**: Automated migrations
- **Health Checks**: Deployment verification

### Production Setup
- **Nginx**: Reverse proxy (compose.nginx.yml) (docker compose setup only)
- **SSL Certificates**: External, provided by load balancing
- **Monitoring**: Application monitoring

## Environment Variables

### Required Variables
```bash
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/msaas
MONGODB_TEST_URI=mongodb://localhost:27017/msaas_test

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
FROM_EMAIL=noreply@yourapp.com

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## Development Workflow

### Getting Started
1. Clone repository
2. Copy `.env.example` to `.env`
3. Install dependencies: `npm install`
4. Start MongoDB locally
5. Run development server: `npm run dev`

### Available Scripts
- `npm run dev` - Development server with nodemon
- `npm run test` - Run test suite
- `npm run test:watch` - Watch mode testing
- `npm run test:coverage` - Coverage report
- `npm run lint` - Code linting
- `npm run build` - Production build
- `npm start` - Production server

### Code Standards
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Conventional Commits**: Commit message format

## Future Enhancements

### Additional Features
- **Multi-tenancy**: Support for multiple SaaS instances
- **Admin Dashboard**: User management interface
- **Usage Analytics**: Track feature usage
- **API Keys**: Developer API access
- **Webhooks**: Custom webhook support
- **Integrations**: Third-party service integrations

### Scaling Considerations
- **Microservices**: Service decomposition
- **Caching**: Redis integration
- **CDN**: Static asset delivery
- **Queue System**: Background job processing
- **Database Sharding**: Horizontal scaling
