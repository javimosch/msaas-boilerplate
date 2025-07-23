# MSaaS Boilerplate

A production-ready Node.js boilerplate for building Micro SaaS applications with native MongoDB driver integration and Stripe payment processing.

## Features

- **Authentication**: JWT-based auth with refresh tokens
- **Database**: Native MongoDB driver with connection pooling
- **Payments**: Stripe integration for subscriptions
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston structured logging
- **Email**: Nodemailer for transactional emails
- **Validation**: Express-validator for request validation
- **Error Handling**: Centralized error handling
- **Modular Architecture**: Clean separation of concerns

## Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- MongoDB 4.4+
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd msaas-boilerplate
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB locally or use MongoDB Atlas

5. Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/msaas

# JWT
JWT_SECRET=your-secure-secret
JWT_REFRESH_SECRET=your-refresh-secret

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
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/account` - Delete user account

### Subscriptions
- `GET /api/subscriptions/plans` - Get available plans
- `POST /api/subscriptions/create` - Create subscription
- `GET /api/subscriptions/status` - Get subscription status
- `DELETE /api/subscriptions/cancel` - Cancel subscription

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook endpoint

### Health Check
- `GET /health` - Application health status

## Project Structure

```
src/
├── config/
│   ├── app.js              # Express app configuration
│   ├── database.js         # MongoDB connection
│   ├── jwt.js              # JWT configuration
│   └── stripe.js           # Stripe configuration
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── subscription.controller.js
│   └── webhook.controller.js
├── middleware/
│   ├── auth.middleware.js
│   └── errorHandler.middleware.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── subscription.routes.js
│   └── webhook.routes.js
├── services/
│   ├── auth.service.js
│   ├── stripe.service.js
│   └── email.service.js
├── utils/
│   ├── crypto.js
│   ├── logger.js
│   └── validators.js
└── index.js                # Application entry point
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String,
  firstName: String,
  lastName: String,
  stripeCustomerId: String,
  subscription: {
    status: String,
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

### Subscriptions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  stripeSubscriptionId: String,
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

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Express-validator
- **Password Hashing**: bcryptjs
- **JWT**: Secure token-based authentication

## Stripe Integration

### Setup
1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Set up webhook endpoints
4. Configure your pricing plans

### Webhook Events
The application handles these Stripe webhook events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Email Service

The application sends transactional emails for:
- Welcome emails
- Subscription confirmations
- Payment failure notifications

Configure your SMTP settings in the environment variables.

## Error Handling

Centralized error handling with:
- Custom error classes
- Proper HTTP status codes
- Structured error responses
- Development vs production error details

## Logging

Structured logging with Winston:
- File-based logging
- Console logging in development
- Error and combined logs
- Configurable log levels

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions and support, please open an issue in the repository.