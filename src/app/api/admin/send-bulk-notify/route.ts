import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/services/emailService';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication - simplified for now
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Mock notify users - in production, fetch from database
    const notifyUsers = [
      'user1@example.com',
      'user2@example.com', 
      'user3@example.com'
    ];

    // Send bulk notification email
    const message = {
      subject: '🔥 ARCSTARZ EXCLUSIVE DROP • LIMITED EDITION RELEASE',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ARCSTARZ Exclusive Drop</title>
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
              font-size: 32px;
              font-weight: 900;
              letter-spacing: -1px;
              margin-bottom: 20px;
              text-transform: uppercase;
              border-bottom: 4px solid #0A0A0A;
              padding-bottom: 15px;
              display: inline-block;
            }
            .description {
              font-size: 18px;
              color: #1C1C1C;
              margin-bottom: 40px;
              font-weight: 500;
            }
            .drop-details {
              background: #F5F5F0;
              border: 2px solid #0A0A0A;
              padding: 30px;
              margin: 30px 0;
              text-align: left;
            }
            .drop-title {
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .drop-info {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 15px;
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
              <h2 class="main-title">Exclusive Drop</h2>
              <p class="description">The moment you've been waiting for.</p>
              
              <div class="drop-details">
                <h3 class="drop-title">NEW COLLECTION</h3>
                <p class="drop-info">Introducing our latest limited edition pieces. Available exclusively to Inner Circle members.</p>
                <p class="drop-info"><strong>Launch Date:</strong> [Launch Date]</p>
                <p class="drop-info"><strong>Launch Time:</strong> [Launch Time]</p>
                <p class="drop-info"><strong>Exclusive Access:</strong> Inner Circle members only</p>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-text">
                This exclusive offer is available only to ARCSTARZ Inner Circle members.
              </div>
              <div class="brand-name">ARCSTARZ</div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        🔥 ARCSTARZ EXCLUSIVE DROP • LIMITED EDITION RELEASE
        
        The moment you've been waiting for.
        
        NEW COLLECTION
        Introducing our latest limited edition pieces. Available exclusively to Inner Circle members.
        
        LAUNCH DETAILS:
        Date: [Launch Date]
        Time: [Launch Time]
        Exclusive Access: Inner Circle members only
        
        This exclusive offer is available only to ARCSTARZ Inner Circle members.
        
        ---
        ARCSTARZ
        Luxury Streetwear • Limited Edition
      `
    };

    // Send to all notify users
    let sent = 0;
    let failed = 0;

    for (const email of notifyUsers) {
      try {
        await emailService.sendEmail(email, message);
        sent++;
      } catch (error) {
        console.error(`Failed to send to ${email}:`, error);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk notification sent to ${sent} users`,
      sent,
      failed,
      total: notifyUsers.length
    });

  } catch (error) {
    console.error('Bulk notify API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
