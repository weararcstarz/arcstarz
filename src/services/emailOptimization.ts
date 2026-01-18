/**
 * Email Optimization Service
 * Prevents emails from being marked as spam
 */

interface EmailHeaders {
  'X-Priority'?: string;
  'X-Mailer'?: string;
  'X-MSMail-Priority'?: string;
  'Importance'?: string;
  'Precedence'?: string;
  'List-Unsubscribe'?: string;
  'Reply-To'?: string;
  'Return-Path'?: string;
}

interface SpamCheckResult {
  score: number;
  issues: string[];
  recommendations: string[];
  isSpam: boolean;
}

class EmailOptimizationService {
  private static instance: EmailOptimizationService;

  private constructor() {}

  public static getInstance(): EmailOptimizationService {
    if (!EmailOptimizationService.instance) {
      EmailOptimizationService.instance = new EmailOptimizationService();
    }
    return EmailOptimizationService.instance;
  }

  /**
   * Optimize email headers to prevent spam
   */
  public getOptimizedHeaders(senderEmail: string, replyToEmail?: string): EmailHeaders {
    return {
      'X-Priority': '3', // Normal priority
      'X-Mailer': 'ARCSTARZ Mail System v1.0',
      'X-MSMail-Priority': 'Normal',
      'Importance': 'Normal',
      'Precedence': 'bulk', // Indicates bulk email
      'Reply-To': replyToEmail || senderEmail,
      'Return-Path': senderEmail,
      'List-Unsubscribe': `<mailto:unsubscribe@arcstarz.com?subject=Unsubscribe>`
    };
  }

  /**
   * Check email content for spam triggers
   */
  public checkSpamTriggers(subject: string, htmlContent: string, textContent: string): SpamCheckResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check subject line
    if (this.hasSpamWords(subject)) {
      issues.push('Subject contains spam trigger words');
      score += 20;
    }

    if (subject.length > 50) {
      issues.push('Subject line too long (>50 chars)');
      score += 10;
    }

    if (this.isAllCaps(subject)) {
      issues.push('Subject line is all caps');
      score += 15;
    }

    if (this.hasExcessivePunctuation(subject)) {
      issues.push('Subject has excessive punctuation');
      score += 10;
    }

    // Check HTML content
    if (this.hasSpamWords(htmlContent)) {
      issues.push('HTML content contains spam trigger words');
      score += 15;
    }

    if (this.hasTooManyLinks(htmlContent)) {
      issues.push('Too many links in email');
      score += 10;
    }

    if (this.hasLargeImages(htmlContent)) {
      issues.push('Email contains large images');
      score += 10;
    }

    if (this.isHtmlHeavy(htmlContent)) {
      issues.push('HTML-to-text ratio too high');
      score += 15;
    }

    // Check text content
    if (textContent.length < 50) {
      issues.push('Text content too short');
      score += 10;
    }

    if (this.hasSpamWords(textContent)) {
      issues.push('Text content contains spam trigger words');
      score += 15;
    }

    // Generate recommendations
    if (score > 30) {
      recommendations.push('Consider simplifying the subject line');
      recommendations.push('Remove excessive punctuation and caps');
      recommendations.push('Balance HTML and text content');
      recommendations.push('Avoid spam trigger words');
    }

    if (this.hasSpamWords(subject)) {
      recommendations.push('Replace words like: free, guarantee, winner, etc.');
    }

    return {
      score,
      issues,
      recommendations,
      isSpam: score > 50
    };
  }

  /**
   * Optimize email content for better deliverability
   */
  public optimizeContent(subject: string, htmlContent: string, textContent: string): {
    optimizedSubject: string;
    optimizedHtml: string;
    optimizedText: string;
  } {
    return {
      optimizedSubject: this.optimizeSubject(subject),
      optimizedHtml: this.optimizeHtml(htmlContent),
      optimizedText: this.optimizeText(textContent)
    };
  }

  /**
   * Generate SPF, DKIM, and DMARC records
   */
  public generateAuthenticationRecords(domain: string): {
    spf: string;
    dkim: string;
    dmarc: string;
  } {
    return {
      spf: `v=spf1 include:_spf.google.com include:sendgrid.net ~all`,
      dkim: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...`,
      dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; ruf=mailto:dmarc@${domain}; fo=1`
    };
  }

  /**
   * Get best practices for email deliverability
   */
  public getDeliverabilityBestPractices(): string[] {
    return [
      'Use authenticated email (SPF, DKIM, DMARC)',
      'Keep subject lines under 50 characters',
      'Avoid spam trigger words (free, guarantee, winner)',
      'Balance HTML and text content (60/40 ratio)',
      'Include plain text version',
      'Use consistent sender information',
      'Provide clear unsubscribe link',
      'Avoid excessive punctuation and caps',
      'Test with spam checkers before sending',
      'Warm up IP addresses gradually',
      'Monitor bounce and complaint rates',
      'Use reputable email service provider'
    ];
  }

  /**
   * Check for spam trigger words
   */
  private hasSpamWords(content: string): boolean {
    const spamWords = [
      'free', 'guarantee', 'winner', 'congratulations', 'click here',
      'promotion', 'special offer', 'limited time', 'act now',
      'call now', 'order now', 'buy now', 'subscribe now',
      'amazing', 'incredible', 'unbelievable', 'miracle',
      'risk free', 'no cost', '100% free', 'bonus',
      'cash', 'money', 'income', 'profit', 'investment',
      'viagra', 'cialis', 'pharmacy', 'medication',
      'weight loss', 'diet', 'lose weight', 'slim'
    ];

    const lowerContent = content.toLowerCase();
    return spamWords.some(word => lowerContent.includes(word));
  }

  /**
   * Check if text is all caps
   */
  private isAllCaps(text: string): boolean {
    const upperText = text.toUpperCase();
    const lowerText = text.toLowerCase();
    return text === upperText && text !== lowerText;
  }

  /**
   * Check for excessive punctuation
   */
  private hasExcessivePunctuation(text: string): boolean {
    const punctuationCount = (text.match(/[!?.]/g) || []).length;
    return punctuationCount > 3;
  }

  /**
   * Check for too many links
   */
  private hasTooManyLinks(html: string): boolean {
    const linkCount = (html.match(/<a\s/g) || []).length;
    return linkCount > 10;
  }

  /**
   * Check for large images
   */
  private hasLargeImages(html: string): boolean {
    const imgTags = html.match(/<img[^>]*>/g) || [];
    return imgTags.some(img => {
      const width = img.match(/width=["']?(\d+)/);
      const height = img.match(/height=["']?(\d+)/);
      return (width && parseInt(width[1]!) > 600) || (height && parseInt(height[1]!) > 400);
    });
  }

  /**
   * Check if HTML is too heavy compared to text
   */
  private isHtmlHeavy(html: string): boolean {
    const textLength = html.replace(/<[^>]*>/g, '').length;
    const htmlLength = html.length;
    const ratio = textLength / htmlLength;
    return ratio < 0.3; // Less than 30% text content
  }

  /**
   * Optimize subject line
   */
  private optimizeSubject(subject: string): string {
    // Remove excessive punctuation
    let optimized = subject.replace(/[!]{2,}/g, '!').replace(/[?]{2,}/g, '?');
    
    // Convert to proper case
    optimized = optimized.split(' ').map(word => {
      if (word === word.toUpperCase() && word.length > 1) {
        return word.charAt(0) + word.slice(1).toLowerCase();
      }
      return word;
    }).join(' ');
    
    // Limit length
    if (optimized.length > 50) {
      optimized = optimized.substring(0, 47) + '...';
    }
    
    return optimized;
  }

  /**
   * Optimize HTML content
   */
  private optimizeHtml(html: string): string {
    // Add proper DOCTYPE and meta tags
    let optimized = html;
    
    if (!optimized.includes('<!DOCTYPE')) {
      optimized = '<!DOCTYPE html>' + optimized;
    }
    
    // Add proper meta tags for spam filters
    if (!optimized.includes('<meta charset')) {
      optimized = optimized.replace('<head>', '<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }
    
    // Add plain text alternative comment
    if (!optimized.includes('<!-- Plain Text Alternative -->')) {
      optimized += '\n<!-- Plain Text Alternative: This email contains both HTML and plain text versions for better deliverability -->';
    }
    
    return optimized;
  }

  /**
   * Optimize text content
   */
  private optimizeText(text: string): string {
    // Ensure minimum length
    if (text.length < 50) {
      text += '\n\nThis is an automated message from ARCSTARZ. If you have any questions, please contact our support team.';
    }
    
    // Add proper formatting
    text = text.replace(/\n{3,}/g, '\n\n'); // Remove excessive line breaks
    
    return text;
  }

  /**
   * Generate unsubscribe link
   */
  public generateUnsubscribeLink(email: string): string {
    const encodedEmail = encodeURIComponent(email);
    return `https://arcstarz.com/unsubscribe?email=${encodedEmail}`;
  }

  /**
   * Add physical address requirement
   */
  public getPhysicalAddress(): string {
    return `ARCSTARZ
123 Fashion Avenue
New York, NY 10001
United States`;
  }

  /**
   * Get recommended sending schedule
   */
  public getSendingSchedule(): {
    bestDays: string[];
    bestTimes: string[];
    avoidTimes: string[];
    frequency: string;
  } {
    return {
      bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
      bestTimes: ['10:00 AM', '2:00 PM'],
      avoidTimes: ['6:00 PM - 9:00 AM', 'Friday afternoon', 'Weekends'],
      frequency: 'No more than 1-2 times per week'
    };
  }
}

// Export singleton instance
export const emailOptimization = EmailOptimizationService.getInstance();

// Export utility functions
export const checkSpamTriggers = (subject: string, html: string, text: string) => {
  return emailOptimization.checkSpamTriggers(subject, html, text);
};

export const optimizeEmail = (subject: string, html: string, text: string) => {
  return emailOptimization.optimizeContent(subject, html, text);
};

export const getDeliverabilityTips = () => {
  return emailOptimization.getDeliverabilityBestPractices();
};
