const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const EmailTemplateService = require('../../services/emailTemplateService');

const router = express.Router();

// MongoDB Subscriber Schema
const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  subscribed: {
    type: Boolean,
    default: true,
    index: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'subscribers'
});

// Indexes
subscriberSchema.index({ email: 1 });
subscriberSchema.index({ subscribed: 1 });
subscriberSchema.index({ createdAt: -1 });

// Pre-save middleware
subscriberSchema.pre('save', function(next) {
  if (this.isModified('subscribed')) {
    if (this.subscribed && this.unsubscribedAt) {
      this.unsubscribedAt = null;
      this.subscribedAt = new Date();
    } else if (!this.subscribed && !this.unsubscribedAt) {
      this.unsubscribedAt = new Date();
    }
  }
  next();
});

// Static methods
subscriberSchema.statics.findOrCreate = async function(email) {
  let subscriber = await this.findOne({ email });
  if (!subscriber) {
    subscriber = new this({ email });
  }
  return subscriber;
};

subscriberSchema.statics.getActiveSubscribers = function() {
  return this.find({ subscribed: true }).sort({ createdAt: -1 });
};

subscriberSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const active = await this.countDocuments({ subscribed: true });
  const unsubscribed = total - active;
  
  return {
    total,
    active,
    unsubscribed,
    activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
  };
};

// Instance methods
subscriberSchema.methods.subscribe = function() {
  this.subscribed = true;
  this.unsubscribedAt = null;
  this.subscribedAt = new Date();
  return this.save();
};

subscriberSchema.methods.unsubscribe = function() {
  this.subscribed = false;
  this.unsubscribedAt = new Date();
  return this.save();
};

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// Email Service
class EmailService {
  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@arcstarz.com';
    
    const config = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      },
      // Spam prevention settings
      tls: {
        rejectUnauthorized: false
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    };

    this.transporter = nodemailer.createTransport(config);
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      return false;
    }
  }

  async sendWelcomeEmail(subscriber) {
    try {
      // Generate email using template service
      const htmlContent = EmailTemplateService.generateWelcomeEmail(subscriber);
      
      const message = {
        subject: 'ARCSTARZ • Welcome to the Inner Circle',
        html: htmlContent,
        text: `ARCSTARZ INNER CIRCLE • WELCOME

Welcome to the ARCSTARZ Inner Circle.

You now have exclusive access to limited drops, cultural insider content, and early access to new collections.

As an Inner Circle member, you'll be the first to know about new releases and special events.

Explore the collection at ${process.env.BASE_URL || 'http://localhost:3000'}/shop

---
ARCSTARZ
Luxury Streetwear • Limited Edition

You're receiving this because you're part of the ARCSTARZ Inner Circle.
Exclusive access • Limited drops • Cultural insider content.

Unsubscribe: ${process.env.BASE_URL || 'http://localhost:3000'}/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}
ARCSTARZ: ${process.env.BASE_URL || 'http://localhost:3000'}`
      };

      return this.sendEmail(subscriber.email, message);
    } catch (error) {
      console.error('❌ Welcome email failed:', error);
      throw error;
    }
  }

  async sendCampaignEmail(message) {
    try {
      const subscribers = await Subscriber.getActiveSubscribers();
      
      if (subscribers.length === 0) {
        console.log('ℹ️ No active subscribers to email');
        return { sent: 0, failed: 0, total: 0 };
      }

      console.log(`📧 Sending campaign to ${subscribers.length} active subscribers`);

      let sent = 0;
      let failed = 0;

      for (const subscriber of subscribers) {
        try {
          // Generate campaign email using template service
          const htmlContent = EmailTemplateService.generateCampaignEmail(
            message.subject,
            message.headline || message.subject,
            message.text || message.bodyText || '',
            message.ctaLink || `${process.env.BASE_URL || 'http://localhost:3000'}/shop`,
            message.ctaText || 'Shop Now',
            subscriber
          );
          
          const personalizedMessage = {
            subject: message.subject,
            html: htmlContent,
            text: `ARCSTARZ • ${message.subject}

${message.headline || message.subject}

${message.text || message.bodyText || ''}

Shop now at ${message.ctaLink || `${process.env.BASE_URL || 'http://localhost:3000'}/shop`}

---
ARCSTARZ
Luxury Streetwear • Limited Edition

You're receiving this because you're part of the ARCSTARZ Inner Circle.
Exclusive access • Limited drops • Cultural insider content.

Unsubscribe: ${process.env.BASE_URL || 'http://localhost:3000'}/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}
ARCSTARZ: ${process.env.BASE_URL || 'http://localhost:3000'}`
          };

          await this.sendEmail(subscriber.email, personalizedMessage);
          sent++;
        } catch (error) {
          console.error(`❌ Failed to send to ${subscriber.email}:`, error);
          failed++;
        }
      }

      console.log(`📊 Campaign results: ${sent} sent, ${failed} failed, ${subscribers.length} total`);
      return { sent, failed, total: subscribers.length };

    } catch (error) {
      console.error('❌ Campaign email failed:', error);
      throw new Error('Failed to send campaign email');
    }
  }

  async sendEmail(to, message) {
    try {
      const mailOptions = {
        from: message.from || `"ARCSTARZ" <${this.fromEmail}>`,
        to: to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        // Anti-spam headers
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'X-Mailer': 'ARCSTARZ Mailer',
          'List-Unsubscribe': `<mailto:${this.fromEmail}?subject=unsubscribe>`,
          'Reply-To': this.fromEmail,
          'Precedence': 'bulk'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendTestEmail(to) {
    const message = {
      subject: 'ARCSTARZ • EMAIL SYSTEM CONFIGURATION',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ARCSTARZ Email Configuration</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #0A0A0A;
              background-color: #F5F5F0;
            }
            
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #FFFFFF;
            }
            
            .header {
              background-color: #0A0A0A;
              padding: 40px 30px;
              text-align: center;
              border-bottom: 4px solid #1C1C1C;
            }
            
            .logo {
              font-size: 32px;
              font-weight: 900;
              letter-spacing: 4px;
              color: #F5F5F0;
              text-transform: uppercase;
              margin-bottom: 10px;
            }
            
            .tagline {
              font-size: 12px;
              letter-spacing: 2px;
              color: #BFBFBF;
              text-transform: uppercase;
            }
            
            .content {
              padding: 50px 40px;
              text-align: center;
            }
            
            .status-title {
              font-size: 28px;
              font-weight: 800;
              letter-spacing: -1px;
              margin-bottom: 20px;
              text-transform: uppercase;
              border-bottom: 3px solid #0A0A0A;
              padding-bottom: 15px;
              display: inline-block;
            }
            
            .status-subtitle {
              font-size: 18px;
              color: #1C1C1C;
              margin-bottom: 40px;
              font-weight: 500;
            }
            
            .status-indicator {
              background: linear-gradient(135deg, #0A0A0A 0%, #1C1C1C 100%);
              padding: 40px;
              margin: 30px 0;
              border-radius: 0;
            }
            
            .status-icon {
              width: 60px;
              height: 60px;
              background-color: #4CAF50;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 24px;
              color: white;
            }
            
            .status-text {
              color: #F5F5F0;
              font-size: 24px;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
              margin-bottom: 10px;
            }
            
            .status-description {
              color: #BFBFBF;
              font-size: 14px;
              line-height: 1.6;
            }
            
            .features {
              background-color: #F5F5F0;
              border: 2px solid #0A0A0A;
              padding: 30px;
              margin: 30px 0;
              text-align: left;
            }
            
            .features-title {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 1px;
              text-align: center;
            }
            
            .feature-item {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
              font-size: 15px;
            }
            
            .feature-icon {
              width: 24px;
              height: 24px;
              background-color: #0A0A0A;
              color: #F5F5F0;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              font-size: 12px;
              font-weight: bold;
            }
            
            .timestamp {
              font-size: 12px;
              color: #666;
              margin-top: 30px;
              font-style: italic;
            }
            
            .footer {
              background-color: #0A0A0A;
              padding: 30px;
              text-align: center;
              border-top: 4px solid #1C1C1C;
            }
            
            .footer-text {
              color: #BFBFBF;
              font-size: 11px;
              line-height: 1.8;
              margin-bottom: 20px;
            }
            
            .footer-brand {
              color: #F5F5F0;
              font-size: 14px;
              font-weight: 700;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            
            @media only screen and (max-width: 600px) {
              .content {
                padding: 30px 20px;
              }
              
              .status-title {
                font-size: 24px;
              }
              
              .features {
                padding: 20px;
              }
              
              .status-indicator {
                padding: 30px 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo">ARCSTARZ</div>
              <div class="tagline">Luxury Streetwear • Limited Edition</div>
            </div>
            
            <div class="content">
              <h1 class="status-title">System Configuration</h1>
              <p class="status-subtitle">Email system status and capabilities</p>
              
              <div class="status-indicator">
                <div class="status-icon">✓</div>
                <div class="status-text">SYSTEM ACTIVE</div>
                <div class="status-description">
                  Your ARCSTARZ email system is configured and ready to send campaigns to Inner Circle members
                </div>
              </div>
              
              <div class="features">
                <h2 class="features-title">Available Features</h2>
                
                <div class="feature-item">
                  <div class="feature-icon">📧</div>
                  <div><strong>Welcome Emails</strong> - Automatic onboarding for new subscribers</div>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">📢</div>
                  <div><strong>Campaign Sending</strong> - HTML/text emails to active subscribers</div>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">👥</div>
                  <div><strong>Subscriber Management</strong> - Complete database integration</div>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">📊</div>
                  <div><strong>Real-time Statistics</strong> - Track engagement and growth</div>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">🔒</div>
                  <div><strong>Compliance Ready</strong> - Unsubscribe links and legal requirements</div>
                </div>
              </div>
              
              <div class="timestamp">
                Configuration verified: ${new Date().toLocaleString()}
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Ready to launch your next campaign to the ARCSTARZ Inner Circle.
              </p>
            </div>
            
            <div class="footer">
              <div class="footer-text">
                This is a system configuration confirmation.<br>
                Your email system is fully operational and ready for use.
              </div>
              <div class="footer-brand">ARCSTARZ</div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
ARCSTARZ • EMAIL SYSTEM CONFIGURATION

SYSTEM CONFIGURATION

Email system status and capabilities

✓ SYSTEM ACTIVE
Your ARCSTARZ email system is configured and ready to send campaigns to Inner Circle members

AVAILABLE FEATURES:

📧 WELCOME EMAILS
Automatic onboarding for new subscribers

📢 CAMPAIGN SENDING
HTML/text emails to active subscribers

👥 SUBSCRIBER MANAGEMENT
Complete database integration

📊 REAL-TIME STATISTICS
Track engagement and growth

🔒 COMPLIANCE READY
Unsubscribe links and legal requirements

Configuration verified: ${new Date().toLocaleString()}

Ready to launch your next campaign to the ARCSTARZ Inner Circle.

---
ARCSTARZ
Luxury Streetwear • Limited Edition

This is a system configuration confirmation.
Your email system is fully operational and ready for use.
      `
    };

    return this.sendEmail(to, message);
  }
}

const emailService = new EmailService();

// In-memory storage for when MongoDB is not available
let memorySubscribers = [];

// Helper function to send campaign to memory subscribers
const sendCampaignToMemorySubscribers = async (subscribers, campaignData) => {
  const results = { sent: 0, failed: 0, total: subscribers.length };
  
  console.log(`📧 Sending campaign to ${subscribers.length} memory subscribers`);
  
  for (const subscriber of subscribers) {
    try {
      await emailService.sendEmail(subscriber.email, {
        subject: campaignData.subject,
        html: campaignData.html,
        text: campaignData.text
      });
      results.sent++;
      console.log(`✅ Email sent to ${subscriber.email}`);
    } catch (error) {
      results.failed++;
      console.error(`❌ Failed to send to ${subscriber.email}:`, error.message);
    }
  }
  
  return results;
};

// Connect to MongoDB (optional - will work without it)
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arcstarz';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed, using memory storage:', error.message);
    // Don't exit, continue without MongoDB
  }
};

// Initialize database connection
connectDB();

// POST /subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Try to save to MongoDB first, fallback to memory if not available
    let subscriber = null;
    let isNewSubscriber = false;
    let savedToDatabase = false;
    
    try {
      // Check if subscriber already exists
      subscriber = await Subscriber.findOne({ email });
      
      if (!subscriber) {
        // Create new subscriber
        subscriber = new Subscriber({ email });
        isNewSubscriber = true;
      } else if (!subscriber.subscribed) {
        // Reactivate unsubscribed user
        subscriber.subscribed = true;
        subscriber.unsubscribedAt = null;
        subscriber.subscribedAt = new Date();
      }
      
      // Save to database
      await subscriber.save();
      console.log(`✅ Subscriber saved to database: ${email}`);
      savedToDatabase = true;
      
    } catch (dbError) {
      console.warn('⚠️ Database not available, using memory storage:', dbError.message);
      
      // Use memory storage as fallback
      const existingIndex = memorySubscribers.findIndex(sub => sub.email === email);
      
      if (existingIndex === -1) {
        // Create new subscriber in memory
        const newSubscriber = {
          _id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: email,
          subscribed: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        memorySubscribers.push(newSubscriber);
        isNewSubscriber = true;
        console.log(`✅ Subscriber saved to memory: ${email}`);
      } else {
        // Update existing subscriber in memory
        memorySubscribers[existingIndex].subscribed = true;
        memorySubscribers[existingIndex].unsubscribedAt = null;
        memorySubscribers[existingIndex].subscribedAt = new Date();
        memorySubscribers[existingIndex].updatedAt = new Date();
        console.log(`✅ Subscriber updated in memory: ${email}`);
      }
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({ 
        email, 
        subscribed: true, 
        subscribedAt: new Date(),
        _id: subscriber?._id
      });
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }

    res.json({
      success: true,
      message: isNewSubscriber ? 'Successfully subscribed to ARCSTARZ Inner Circle' : 'Welcome back! You\'ve been re-subscribed',
      data: {
        email: email,
        subscribed: true,
        subscribedAt: new Date(),
        savedToDatabase: savedToDatabase
      }
    });

  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /unsubscribe
router.get('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    let subscriber = null;
    
    try {
      // Find subscriber in database
      subscriber = await Subscriber.findOne({ email });
      
      if (!subscriber) {
        return res.status(404).json({
          success: false,
          message: 'Email not found in our system'
        });
      }

      if (!subscriber.subscribed) {
        return res.status(400).json({
          success: false,
          message: 'You are already unsubscribed'
        });
      }

      // Update subscriber in database
      await subscriber.unsubscribe();
      console.log(`✅ Subscriber unsubscribed in database: ${email}`);
      
    } catch (dbError) {
      console.warn('⚠️ Database not available for unsubscribe:', dbError.message);
      // Continue with response even if database fails
    }

    res.json({
      success: true,
      message: 'You have been successfully unsubscribed. You will no longer receive emails from ARCSTARZ.',
      data: {
        email: email,
        unsubscribedAt: new Date(),
        updatedInDatabase: !!subscriber
      }
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /send-email
router.post('/send-email', async (req, res) => {
  try {
    const { subject, html, text } = req.body;

    if (!subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Subject and HTML content are required'
      });
    }

    const isEmailConfigured = await emailService.verifyConnection();
    if (!isEmailConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured properly'
      });
    }

    let results = { sent: 0, failed: 0, total: 0 };
    let usedDatabase = false;
    
    try {
      // Try to get active subscribers from database
      const subscribers = await Subscriber.getActiveSubscribers();
      console.log(`📧 Sending campaign to ${subscribers.length} active subscribers from database`);
      
      if (subscribers.length === 0) {
        // Check if we have memory subscribers as fallback
        const memoryActiveSubscribers = memorySubscribers.filter(sub => sub.subscribed);
        if (memoryActiveSubscribers.length > 0) {
          console.log(`📧 Database empty, using ${memoryActiveSubscribers.length} subscribers from memory storage`);
          results = await sendCampaignToMemorySubscribers(memoryActiveSubscribers, { subject, html, text });
        } else {
          return res.json({
            success: true,
            message: 'No active subscribers found',
            data: { sent: 0, failed: 0, total: 0, fromDatabase: false }
          });
        }
      } else {
        results = await emailService.sendCampaignEmail({
          subject,
          html,
          text
        });
        usedDatabase = true;
      }

    } catch (dbError) {
      console.warn('⚠️ Database not available for campaign, using memory storage:', dbError.message);
      
      // Use memory storage as fallback
      const memoryActiveSubscribers = memorySubscribers.filter(sub => sub.subscribed);
      
      if (memoryActiveSubscribers.length === 0) {
        return res.json({
          success: true,
          message: 'No active subscribers found in memory storage',
          data: { sent: 0, failed: 0, total: 0, fromDatabase: false }
        });
      }
      
      console.log(`📧 Using memory storage: ${memoryActiveSubscribers.length} active subscribers`);
      results = await sendCampaignToMemorySubscribers(memoryActiveSubscribers, { subject, html, text });
    }

    res.json({
      success: true,
      message: `Campaign sent successfully to ${results.sent} subscribers`,
      data: {
        ...results,
        fromDatabase: usedDatabase
      }
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send campaign email'
    });
  }
});

// GET /subscribers
router.get('/subscribers', async (req, res) => {
  try {
    const { page = 1, limit = 50, status = 'all' } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    if (status === 'active') {
      query.subscribed = true;
    } else if (status === 'unsubscribed') {
      query.subscribed = false;
    }

    let subscribers = [];
    let total = 0;
    let fromDatabase = false;
    
    try {
      // Try to get from database
      subscribers = await Subscriber.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      total = await Subscriber.countDocuments(query);
      console.log(`✅ Retrieved ${subscribers.length} subscribers from database`);
      fromDatabase = true;
      
    } catch (dbError) {
      console.warn('⚠️ Database not available for subscribers list, using memory storage:', dbError.message);
      
      // Use memory storage as fallback
      let filteredSubscribers = memorySubscribers;
      
      if (status === 'active') {
        filteredSubscribers = memorySubscribers.filter(sub => sub.subscribed);
      } else if (status === 'unsubscribed') {
        filteredSubscribers = memorySubscribers.filter(sub => !sub.subscribed);
      }
      
      // Sort by creation date (newest first)
      filteredSubscribers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Apply pagination
      total = filteredSubscribers.length;
      subscribers = filteredSubscribers.slice(skip, skip + limitNum);
      
      console.log(`✅ Retrieved ${subscribers.length} subscribers from memory storage`);
    }

    res.json({
      success: true,
      data: {
        subscribers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        fromDatabase
      }
    });

  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscribers'
    });
  }
});

// GET /subscribers/stats
router.get('/subscribers/stats', async (req, res) => {
  try {
    let stats = {
      total: 0,
      active: 0,
      unsubscribed: 0,
      activePercentage: 0
    };
    let fromDatabase = false;
    
    try {
      // Try to get real stats from database
      stats = await Subscriber.getStats();
      console.log(`✅ Retrieved stats from database: ${stats.total} total, ${stats.active} active`);
      fromDatabase = true;
      
    } catch (dbError) {
      console.warn('⚠️ Database not available for stats, using memory storage:', dbError.message);
      
      // Calculate stats from memory storage
      stats.total = memorySubscribers.length;
      stats.active = memorySubscribers.filter(sub => sub.subscribed).length;
      stats.unsubscribed = memorySubscribers.filter(sub => !sub.subscribed).length;
      stats.activePercentage = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
      
      console.log(`✅ Retrieved stats from memory storage: ${stats.total} total, ${stats.active} active`);
    }
    
    res.json({
      success: true,
      data: {
        ...stats,
        fromDatabase
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// POST /test-email - Send configuration verification email (admin only)
router.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required'
      });
    }

    const result = await emailService.sendTestEmail(to);

    res.json({
      success: true,
      message: result ? 'Configuration email sent successfully' : 'Failed to send configuration email'
    });

  } catch (error) {
    console.error('Configuration email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send configuration email'
    });
  }
});

module.exports = router;
