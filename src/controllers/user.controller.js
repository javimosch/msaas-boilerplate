const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class UserController {
  async getProfile(req, res, next) {
    try {
      res.json({
        success: true,
        data: { user: req.user }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName } = req.body;
      const db = getDB();
      
      const updateData = {
        'metadata.updatedAt': new Date()
      };
      
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      
      const result = await db.collection('users').findOneAndUpdate(
        { _id: new ObjectId(req.user._id) },
        { $set: updateData },
        { 
          returnDocument: 'after',
          projection: { passwordHash: 0 }
        }
      );
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: result.value }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async deleteAccount(req, res, next) {
    try {
      const db = getDB();
      
      // Delete user subscriptions
      await db.collection('subscriptions').deleteMany({
        userId: new ObjectId(req.user._id)
      });
      
      // Delete user payments
      await db.collection('payments').deleteMany({
        userId: new ObjectId(req.user._id)
      });
      
      // Delete user
      await db.collection('users').deleteOne({
        _id: new ObjectId(req.user._id)
      });
      
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();