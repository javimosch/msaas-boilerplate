# Rspack + Vue Minimal Application

This is a minimal Vue application bundled with Rspack, the fast Rust-based web bundler with webpack-compatible API.

## Features

- ⚡ **Fast Bundling**: Leverages Rspack's Rust-based bundling for high performance
- 🖼️ **Vue**: Includes Vue 3 with Single File Component support
- 🔥 **Hot Module Replacement**: Quick feedback during development
- 🎨 **CSS Support**: Scoped and global CSS styling
- 🧩 **Modular Architecture**: Components, Services, and Utilities cleanly separated

## Getting Started

### Prerequisites

- Node.js >= 16.0.0 (recommended: LTS version)
- npm or yarn

### Installation

```bash
# Clone the repository (or create it as shown below)
mkdir rspack-vue
cd rspack-vue

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

This will start the development server at `http://localhost:3000` with hot module replacement enabled.

### Production Build

```bash
# Create production build
npm run build
```

The production build will be available in the `dist` directory.

## Environment Variables

The application supports environment variables through `.env` files:

- `.env`: Default environment variables for all environments
- `.env.development`: Variables for development environment
- `.env.production`: Variables for production environment

## Project Structure

```
rspack-vue/
├── public/                # Static files
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
