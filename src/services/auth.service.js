const { getDB } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/crypto');
const { generateTokens } = require('../config/jwt');
const { ObjectId } = require('mongodb');
const stripeService = require('./stripe.service');

class AuthService {
  async register(userData) {
    const db = getDB();
    const { email, password, firstName, lastName } = userData;
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create Stripe customer
    const stripeCustomer = await stripeService.createCustomer({
      email,
      name: `${firstName} ${lastName}`
    });
    
    // Create user
    const user = {
      email,
      passwordHash,
      firstName,
      lastName,
      stripeCustomerId: stripeCustomer.id,
      subscription: {
        status: 'inactive',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        planId: null,
        subscriptionId: null
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        loginCount: 0
      }
    };
    
    const result = await db.collection('users').insertOne(user);
    
    // Generate tokens
    const tokens = generateTokens({ userId: result.insertedId.toString() });
    
    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return {
      user: { ...userWithoutPassword, _id: result.insertedId },
      tokens
    };
  }
  
  async login(email, password) {
    const db = getDB();
    
    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Update login metadata
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          'metadata.lastLogin': new Date(),
          'metadata.updatedAt': new Date()
        },
        $inc: { 'metadata.loginCount': 1 }
      }
    );
    
    // Generate tokens
    const tokens = generateTokens({ userId: user._id.toString() });
    
    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      tokens
    };
  }
  
  async refreshToken(refreshToken) {
    const { verifyRefreshToken } = require('../config/jwt');
    
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const db = getDB();
      
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { passwordHash: 0 } }
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const tokens = generateTokens({ userId: user._id.toString() });
      
      return { user, tokens };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}

module.exports = new AuthService();