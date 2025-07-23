const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
  
  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: user.email,
        subject: 'Welcome to MSaaS Boilerplate!',
        html: `
          <h1>Welcome ${user.firstName}!</h1>
          <p>Thank you for joining MSaaS Boilerplate. We're excited to have you on board!</p>
          <p>You can now start exploring our features and set up your subscription.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The MSaaS Team</p>
        `
      };
      
      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${user.email}`);
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
    }
  }
  
  async sendSubscriptionConfirmation(user, subscription) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: user.email,
        subject: 'Subscription Confirmed',
        html: `
          <h1>Subscription Confirmed!</h1>
          <p>Hi ${user.firstName},</p>
          <p>Your subscription has been successfully activated.</p>
          <p><strong>Subscription Details:</strong></p>
          <ul>
            <li>Status: ${subscription.status}</li>
            <li>Current Period: ${subscription.currentPeriodStart} - ${subscription.currentPeriodEnd}</li>
          </ul>
          <p>Thank you for your business!</p>
          <p>Best regards,<br>The MSaaS Team</p>
        `
      };
      
      await this.transporter.sendMail(mailOptions);
      logger.info(`Subscription confirmation email sent to ${user.email}`);
    } catch (error) {
      logger.error('Failed to send subscription confirmation email:', error);
    }
  }
  
  async sendPaymentFailedEmail(user) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: user.email,
        subject: 'Payment Failed - Action Required',
        html: `
          <h1>Payment Failed</h1>
          <p>Hi ${user.firstName},</p>
          <p>We were unable to process your recent payment. Please update your payment method to continue using our service.</p>
          <p>You can update your payment method in your account settings.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The MSaaS Team</p>
        `
      };
      
      
      await this.transporter.sendMail(mailOptions);
      logger.info(`Payment failed email sent to ${user.email}`);
    } catch (error) {
      logger.error('Failed to send payment failed email:', error);
    }
  }
}

module.exports = new EmailService();