import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send notify me confirmation email
    const emailSent = await emailService.sendNotifyMeEmail(email);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send notification email' },
        { status: 500 }
      );
    }

    // Here you could also save the email to a database for future notifications
    // For now, we'll just send the confirmation email

    return NextResponse.json({
      success: true,
      message: 'Notification confirmed! You\'ll be the first to know when we drop.',
      email: email
    });

  } catch (error) {
    console.error('Notify me API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
