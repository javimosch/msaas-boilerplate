# Rspack + Vue Minimal Application

This is a minimal Vue application bundled with Rspack, the fast Rust-based web bundler with webpack-compatible API.

## Features

### Core Features
- **Vue 3 Composition API** - Modern reactive framework with TypeScript support
- **Pinia State Management** - Intuitive state management with stores
- **Vue Router** - Client-side routing with navigation guards
- **Rspack Bundling** - Fast Rust-based bundler with webpack compatibility
- **Axios HTTP Client** - Comprehensive API client with interceptors
- **VueUse Composables** - Collection of essential Vue composition utilities

### Authentication & Security
- **JWT Authentication** - Secure token-based authentication
- **Automatic Token Refresh** - Seamless token renewal
- **Route Protection** - Authentication guards for protected routes
- **Role-based Access** - User role management and permissions

### UI/UX Features
- **Responsive Design** - Mobile-first responsive layout
- **Dark/Light Theme** - Theme switching with persistence
- **Notification System** - Toast notifications with auto-dismiss
- **Loading States** - Global and component-level loading indicators
- **Error Handling** - Comprehensive error handling and user feedback

### Developer Experience
- **Hot Module Replacement** - Fast development with HMR
- **Path Aliases** - Clean imports with @ alias
- **Modular Architecture** - Well-organized codebase structure
- **Utility Functions** - Comprehensive helper functions
- **Environment Configuration** - Environment-based configuration

## Project Structure

```
src/
├── components/          # Reusable Vue components
│   ├── layout/         # Layout components (Header, Sidebar)
│   └── ui/             # UI components (Button, Modal)
├── config/             # Application configuration
│   └── app.config.js   # Main app configuration
├── router/             # Vue Router configuration
│   └── index.js        # Route definitions and guards
├── services/           # API and external services
│   ├── api.service.js  # HTTP client with interceptors
│   ├── auth.service.js # Authentication service
│   └── token.service.js # Token management
├── stores/             # Pinia stores
│   ├── auth.store.js   # Authentication state
│   └── app.store.js    # Global application state
├── utils/              # Utility functions
│   └── helpers.js      # Common helper functions
├── views/              # Page components
│   ├── auth/           # Authentication pages
│   ├── user/           # User management pages
│   ├── billing/        # Billing and subscription pages
│   └── errors/         # Error pages
├── App.vue             # Root component
└── main.js             # Application entry point
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend API running (see main project README)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   VUE_APP_API_URL=http://localhost:3000
   VUE_APP_NAME=MSaaS App
   VUE_APP_VERSION=1.0.0
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3001`

4. **Build for production:**
   ```bash
   npm run build
   ```

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code with ESLint
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI

## Architecture

### State Management
The application uses Pinia for state management with the following stores:

- **Auth Store** (`auth.store.js`) - User authentication, login/logout, token management
- **App Store** (`app.store.js`) - Global UI state, notifications, theme, loading states

### Routing
Vue Router handles client-side routing with:
- **Navigation Guards** - Authentication and authorization checks
- **Lazy Loading** - Components loaded on demand
- **Meta Fields** - Route-specific configuration

### API Integration
Axios-based HTTP client with:
- **Request Interceptors** - Automatic token attachment
- **Response Interceptors** - Error handling and token refresh
- **Retry Logic** - Automatic retry for failed requests

### Component Organization
- **Layout Components** - App structure (Header, Sidebar)
- **UI Components** - Reusable interface elements
- **View Components** - Page-level components
- **Utility Components** - Helper components (Loading, Notifications)

## Styling

The application uses a custom CSS framework with:

### CSS Variables
- **Theme Colors** - Primary, secondary, success, warning, error
- **Typography** - Font sizes, weights, line heights
- **Spacing** - Consistent spacing scale
- **Shadows** - Elevation system
- **Border Radius** - Consistent border radius scale

### Theme System
- **Light/Dark Mode** - Automatic theme switching
- **CSS Custom Properties** - Dynamic theme variables
- **Responsive Design** - Mobile-first approach
- **Utility Classes** - Common styling utilities

## Authentication Flow

1. **Login/Register** - User submits credentials
2. **Token Storage** - JWT tokens stored in localStorage
3. **API Requests** - Tokens automatically attached to requests
4. **Token Refresh** - Automatic refresh before expiration
5. **Route Protection** - Navigation guards check authentication
6. **Logout** - Tokens cleared and user redirected

## Error Handling

- **Global Error Handler** - Catches and logs all Vue errors
- **API Error Interceptor** - Handles HTTP errors gracefully
- **User Feedback** - Toast notifications for errors
- **Fallback UI** - Error boundaries for component failures

## Responsive Design

Breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 768px
- **Desktop**: > 768px

Features:
- Mobile-first CSS
- Responsive navigation
- Touch-friendly interactions
- Optimized layouts for all devices

## Configuration

### Environment Variables
```env
# API Configuration
VUE_APP_API_URL=http://localhost:3000

# App Information
VUE_APP_NAME=MSaaS App
VUE_APP_VERSION=1.0.0
VUE_APP_DEBUG=true

# Feature Flags
VUE_APP_ANALYTICS=false
VUE_APP_BETA_FEATURES=false

# Stripe (for payments)
VUE_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
VUE_APP_STRIPE_TEST_MODE=true
```

### Build Configuration
Rspack configuration in `rspack.config.js`:
- Path aliases (@/ for src/)
- Asset optimization
- Code splitting
- Development server settings

## Testing

The project uses Vitest for testing:
- **Unit Tests** - Component and utility testing
- **Integration Tests** - Store and service testing
- **E2E Tests** - Full application flow testing

## Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
1. Set production environment variables
2. Configure API endpoints
3. Set up CDN for assets (optional)
4. Configure web server for SPA routing

### Web Server Configuration
For proper SPA routing, configure your web server to serve `index.html` for all routes.

**Nginx Example:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```
│   └── index.html         # HTML template
├── src/                   # Source files
│   ├── components/        # Vue components
│   │   └── MyButton.vue   # Button component
│   ├── services/          # Service modules
│   │   └── api.js         # API service
│   ├── utils/             # Utility functions
│   │   └── helpers.js     # Helper functions
│   ├── App.vue            # Main App component
│   └── main.js            # Entry point
├── .env                   # Environment variables
├── package.json           # Dependencies and scripts
├── rspack.config.js       # Rspack configuration
└── README.md              # Documentation
```

## Learn More

- [Rspack Documentation](https://rspack.rs/guide/start/introduction)
- [Vue Documentation](https://vuejs.org/guide/introduction.html)
