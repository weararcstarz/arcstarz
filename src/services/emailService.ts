import nodemailer from 'nodemailer';
import { ISubscriber } from '../models/Subscriber';

// Email configuration interface
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email message interface
export interface EmailMessage {
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

// Email service class
export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    // Initialize transporter with environment variables
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@arcstarz.com';
    
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      }
    };

    this.transporter = nodemailer.createTransport(config);
  }

  // Verify email configuration
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      return false;
    }
  }

  // Send notify me confirmation email
  async sendNotifyMeEmail(email: string): Promise<boolean> {
    const unsubscribeUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/unsubscribe?email=${encodeURIComponent(email)}`;
    
    const message: EmailMessage = {
      subject: 'ARCSTARZ • NOTIFICATION CONFIRMED',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ARCSTARZ Notification Confirmed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f5f5f0;
              color: #0A0A0A;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
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
              margin: 0;
            }
            .tagline {
              font-size: 12px;
              letter-spacing: 2px;
              color: #BFBFBF;
              text-transform: uppercase;
              margin-top: 8px;
            }
            .content {
              padding: 50px 40px;
              text-align: center;
            }
            .main-title {
              font-size: 28px;
              font-weight: 800;
              letter-spacing: -1px;
              margin-bottom: 20px;
              text-transform: uppercase;
              border-bottom: 3px solid #0A0A0A;
              padding-bottom: 15px;
              display: inline-block;
            }
            .description {
              font-size: 16px;
              color: #1C1C1C;
              margin-bottom: 40px;
              font-weight: 500;
            }
            .status-box {
              background: linear-gradient(135deg, #0A0A0A 0%, #1C1C1C 100%);
              padding: 40px;
              margin: 40px 0;
              border-radius: 0;
            }
            .status-title {
              color: #F5F5F0;
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 20px;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .status-badge {
              background: #F5F5F0;
              color: #0A0A0A;
              padding: 15px 25px;
              font-size: 24px;
              font-weight: 900;
              letter-spacing: 3px;
              text-transform: uppercase;
              display: inline-block;
              border: 3px solid #F5F5F0;
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
            .brand-name {
              color: #F5F5F0;
              font-size: 14px;
              font-weight: 700;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            .unsubscribe {
              margin-top: 20px;
              padding: 15px;
              background: #f8f8f8;
              border-radius: 5px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://i.imgur.com/Gn5ravD.png" alt="ARCSTARZ" style="width: 40px; height: 40px; margin-bottom: 10px;">
              <h1 class="logo">ARCSTARZ</h1>
              <div class="tagline">Luxury Streetwear • Limited Edition</div>
            </div>
            
            <div class="content">
              <h2 class="main-title">You're On The List</h2>
              <p class="description">You'll be the first to know when we drop. Stay active.</p>
            </div>
            
            <div class="footer">
              <div class="footer-text">
                You've successfully requested drop notifications.<br>
                Stay connected. Stay exclusive. Stay ahead.
              </div>
              <div class="brand-name">ARCSTARZ</div>
            </div>
          </div>
          
          <div class="unsubscribe">
            <p><small>You received this email because you requested ARCSTARZ drop notifications.</small></p>
            <p><small><a href="${unsubscribeUrl}" style="color: #0A0A0A;">Unsubscribe</a> | <a href="${process.env.BASE_URL || 'http://localhost:3000'}" style="color: #0A0A0A;">ARCSTARZ</a></small></p>
          </div>
        </body>
        </html>
      `,
      text: `
        ARCSTARZ • NOTIFICATION CONFIRMED
        
        You're on the list.
        
        You'll be the first to know when we drop. Stay active.
        
        You've successfully requested drop notifications.
        Stay connected. Stay exclusive. Stay ahead.
        
        ---
        ARCSTARZ
        Luxury Streetwear • Limited Edition
        
        Unsubscribe: ${unsubscribeUrl}
        ARCSTARZ: ${process.env.BASE_URL || 'http://localhost:3000'}
      `
    };

    return this.sendEmail(email, message);
  }

  // Send welcome email to new subscriber
  async sendWelcomeEmail(subscriber: ISubscriber): Promise<boolean> {
    const unsubscribeUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
    
    const message: EmailMessage = {
      subject: 'ARCSTARZ INNER CIRCLE • YOUR JOURNEY BEGINS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ARCSTARZ Inner Circle</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f5f5f0;
              color: #0A0A0A;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
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
              margin: 0;
            }
            .tagline {
              font-size: 12px;
              letter-spacing: 2px;
              color: #BFBFBF;
              text-transform: uppercase;
              margin-top: 8px;
            }
            .content {
              padding: 50px 40px;
              text-align: center;
            }
            .main-title {
              font-size: 28px;
              font-weight: 800;
              letter-spacing: -1px;
              margin-bottom: 20px;
              text-transform: uppercase;
              border-bottom: 3px solid #0A0A0A;
              padding-bottom: 15px;
              display: inline-block;
            }
            .description {
              font-size: 16px;
              color: #1C1C1C;
              margin-bottom: 40px;
              font-weight: 500;
            }
            .benefits-box {
              background: #F5F5F0;
              border: 2px solid #0A0A0A;
              padding: 30px;
              margin: 30px 0;
              text-align: left;
            }
            .benefits-title {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .benefit-item {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
              font-size: 15px;
            }
            .benefit-number {
              width: 24px;
              height: 24px;
              background: #0A0A0A;
              color: #F5F5F0;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-box {
              background: linear-gradient(135deg, #0A0A0A 0%, #1C1C1C 100%);
              padding: 40px;
              margin: 40px 0;
              border-radius: 0;
            }
            .status-title {
              color: #F5F5F0;
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 20px;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .status-badge {
              background: #F5F5F0;
              color: #0A0A0A;
              padding: 15px 25px;
              font-size: 24px;
              font-weight: 900;
              letter-spacing: 3px;
              text-transform: uppercase;
              display: inline-block;
              border: 3px solid #F5F5F0;
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
            .brand-name {
              color: #F5F5F0;
              font-size: 14px;
              font-weight: 700;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            .unsubscribe {
              margin-top: 20px;
              padding: 15px;
              background: #f8f8f8;
              border-radius: 5px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://i.imgur.com/Gn5ravD.png" alt="ARCSTARZ" style="width: 40px; height: 40px; margin-bottom: 10px;">
              <h1 class="logo">ARCSTARZ</h1>
              <div class="tagline">Luxury Streetwear • Limited Edition</div>
            </div>
            
            <div class="content">
              <h2 class="main-title">Your Journey Begins</h2>
              <p class="description">Welcome to the exclusive world of ARCSTARZ. You're now part of the Inner Circle.</p>
              
              <div class="benefits-box">
                <h3 class="benefits-title">What's Next?</h3>
                
                <div class="benefit-item">
                  <div class="benefit-number">1</div>
                  <div><strong>Exclusive Access</strong> - Be first to know about new drops</div>
                </div>
                
                <div class="benefit-item">
                  <div class="benefit-number">2</div>
                  <div><strong>Member Benefits</strong> - Special offers and privileges</div>
                </div>
                
                <div class="benefit-item">
                  <div class="benefit-number">3</div>
                  <div><strong>Cultural Insider</strong> - Behind-the-scenes content</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-text">
                You've successfully joined the ARCSTARZ Inner Circle.<br>
                Stay connected. Stay exclusive. Stay ahead.
              </div>
              <div class="brand-name">ARCSTARZ</div>
            </div>
          </div>
          
          <div class="unsubscribe">
            <p><small>You received this email because you subscribed to ARCSTARZ Inner Circle.</small></p>
            <p><small><a href="${unsubscribeUrl}" style="color: #0A0A0A;">Unsubscribe</a> | <a href="${process.env.BASE_URL || 'http://localhost:3000'}" style="color: #0A0A0A;">ARCSTARZ</a></small></p>
          </div>
        </body>
        </html>
      `,
      text: `
        ARCSTARZ INNER CIRCLE • YOUR JOURNEY BEGINS
        
        Welcome to the exclusive world of ARCSTARZ. You're now part of the Inner Circle.
        
        WHAT'S NEXT?
        
        1. EXCLUSIVE ACCESS - Be first to know about new drops
        2. MEMBER BENEFITS - Special offers and privileges
        3. CULTURAL INSIDER - Behind-the-scenes content
        
        You've successfully joined the ARCSTARZ Inner Circle.
        Stay connected. Stay exclusive. Stay ahead.
        
        ---
        ARCSTARZ
        Luxury Streetwear • Limited Edition
        
        Unsubscribe: ${unsubscribeUrl}
        ARCSTARZ: ${process.env.BASE_URL || 'http://localhost:3000'}
      `
    };

    return this.sendEmail(subscriber.email, message);
  }

  // Send campaign email to all active subscribers
  async sendCampaignEmail(message: EmailMessage): Promise<{ sent: number; failed: number; total: number }> {
    try {
      // Get all active subscribers
      const { Subscriber } = await import('../models/Subscriber');
      const subscribers = await (Subscriber as any).getActiveSubscribers();
      
      if (subscribers.length === 0) {
        console.log('ℹ️ No active subscribers to email');
        return { sent: 0, failed: 0, total: 0 };
      }

      console.log(`📧 Sending campaign to ${subscribers.length} active subscribers`);

      let sent = 0;
      let failed = 0;

      // Send emails individually (better for deliverability and personalization)
      for (const subscriber of subscribers) {
        const unsubscribeUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        
        const personalizedMessage = {
          ...message,
          html: message.html + `
            <div class="unsubscribe" style="margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 5px; text-align: center;">
              <p><small>You received this email because you subscribed to ARCSTARZ Inner Circle.</small></p>
              <p><small><a href="${unsubscribeUrl}">Unsubscribe</a> | <a href="${process.env.BASE_URL || 'http://localhost:3000'}">ARCSTARZ</a></small></p>
            </div>
          `,
          text: message.text + `\n\n---\nUnsubscribe: ${unsubscribeUrl}\nARCSTARZ: ${process.env.BASE_URL || 'http://localhost:3000'}`
        };

        try {
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

  // Send single email
  async sendEmail(to: string, message: EmailMessage): Promise<boolean> {
    try {
      const mailOptions = {
        from: message.from || `"ARCSTARZ" <${this.fromEmail}>`,
        to: to,
        subject: message.subject,
        html: message.html,
        text: message.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  // Email configuration verification
  async sendTestEmail(to: string): Promise<boolean> {
    const message: EmailMessage = {
      subject: 'ARCSTARZ Email Configuration',
      html: `
        <h2>Email Configuration Verified</h2>
        <p>This email confirms that your ARCSTARZ email system is configured and working correctly.</p>
        <p>Sent: ${new Date().toLocaleString()}</p>
        <p>Ready to send campaigns to your subscribers.</p>
      `,
      text: `
        Email Configuration Verified
        
        This email confirms that your ARCSTARZ email system is configured and working correctly.
        
        Sent: ${new Date().toLocaleString()}
        Ready to send campaigns to your subscribers.
      `
    };

    return this.sendEmail(to, message);
  }
}

// Singleton instance
export const emailService = new EmailService();
