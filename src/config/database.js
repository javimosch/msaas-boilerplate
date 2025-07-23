const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

let db = null;
let client = null;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/msaas';
    
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    db = client.db();
    
    // Create indexes
    await createIndexes();
    
    logger.info('Connected to MongoDB');
    return db;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

const createIndexes = async () => {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ stripeCustomerId: 1 });
    
    // Subscriptions collection indexes
    await db.collection('subscriptions').createIndex({ userId: 1 });
    await db.collection('subscriptions').createIndex({ stripeSubscriptionId: 1 }, { unique: true });
    
    // Payments collection indexes
    await db.collection('payments').createIndex({ userId: 1 });
    await db.collection('payments').createIndex({ stripePaymentIntentId: 1 });
    
    logger.info('Database indexes created');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    db = null;
    client = null;
    logger.info('Database connection closed');
  }
};

module.exports = {
  connectDB,
  getDB,
  closeDB
};