require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');
const { configureApp } = require('./config/app');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler.middleware');
const fs = require('fs');
// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const webhookRoutes = require('./routes/webhook.routes');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    
    // Configure app middleware
    configureApp(app);
    
    // Landing page route
    app.get('/', (req, res) => {
      res.render('landing', { 
        title: 'MSaaS Boilerplate',
        appUrl: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3001'
      });
    });
    
    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/subscriptions', subscriptionRoutes);
    app.use('/api/webhooks', webhookRoutes);

    //Point app routes to app
    app.use('/*', (req, res, next) => {

      const reqPath = req.initialUrl || req.path;

      //if req url contains "api", do next 
      if(reqPath.includes('api')) {
        next();
        return;
      }

      //if no ext and route is an app route
      const appRoutes = ['/dashboard','/billing','/login','/register']
      if (!reqPath.includes('.') && appRoutes.includes(reqPath)) {

        //if prod
        if(process.env.NODE_ENV === 'production') {
            //if app dist folder exist, send it
            if (fs.existsSync(path.join(process.cwd(), 'app', 'dist', 'index.html'))) {
                res.sendFile(path.join(process.cwd(), 'app', 'dist', 'index.html'));
            }
            //otherwise, return 404
            else {
                res.status(404).send('Not Found');
            }
        }
        //if dev
        else {
          //send app index.html
          res.sendFile(path.join(process.cwd(), 'app', 'dist', 'index.html'));
        }
      }else{
        console.log('not app route', {
          path: reqPath,
          url: req.url,
          initialUrl: req.initialUrl,
          method: req.method,
          ip: req.ip
        })
        next();
      }
    });
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Static files
    app.use(express.static('public'));
    app.use(express.static('app/dist'));
    
    // Error handling middleware
    app.use(errorHandler);
    
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      
      // Schedule subscription reconciliation every 5 minutes
      const cron = require('node-cron');
      const reconciliationService = require('./services/reconciliation.service');
      cron.schedule('*/5 * * * *', () => {
        logger.info('Running subscription reconciliation...');
        reconciliationService.verifySubscriptionStatuses();
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
