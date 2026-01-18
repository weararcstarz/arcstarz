'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { checkSpamTriggers, optimizeEmail, getDeliverabilityTips } from '@/services/emailOptimization';

const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || '1767942289962';
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'bashirali652@icloud.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Subscriber {
  _id: string;
  email: string;
  subscribed: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
  activePercentage: number;
  newThisMonth?: number;
}

interface CampaignForm {
  subject: string;
  html: string;
  text: string;
}

interface SpamCheck {
  score: number;
  issues: string[];
  recommendations: string[];
  isSpam: boolean;
}

// Ready-made templates (Spam-Optimized)
const emailTemplates = {
  drop: {
    name: 'Product Drop Announcement',
    subject: 'New ARCSTARZ Collection Available Now',
    html: `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: #0A0A0A; padding: 40px 30px; text-align: center; border-bottom: 4px solid #1C1C1C;">
        <div style="font-size: 32px; font-weight: 900; letter-spacing: 4px; color: #F5F5F0; text-transform: uppercase; margin-bottom: 10px;">ARCSTARZ</div>
        <div style="font-size: 12px; letter-spacing: 2px; color: #BFBFBF; text-transform: uppercase;">Luxury Streetwear • Limited Edition</div>
    </div>
    
    <div style="padding: 50px 40px; text-align: center;">
        <h1 style="font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px; text-transform: uppercase; border-bottom: 4px solid #0A0A0A; padding-bottom: 15px; display: inline-block;">New Collection</h1>
        <p style="font-size: 18px; color: #1C1C1C; margin-bottom: 40px; font-weight: 500;">Introducing our latest limited edition pieces.</p>
        
        <div style="background: #F5F5F0; border: 2px solid #0A0A0A; padding: 30px; margin: 30px 0;">
            <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px;">Collection Details</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">Premium materials and exclusive designs now available.</p>
            
            <div style="background: #0A0A0A; color: #F5F5F0; padding: 20px; margin: 20px 0;">
                <div style="font-size: 18px; font-weight: 700; margin-bottom: 10px;">Features</div>
                <ul style="text-align: left; margin: 0; padding-left: 20px;">
                    <li>Premium materials</li>
                    <li>Limited quantities</li>
                    <li>Exclusive designs</li>
                    <li>Member pricing</li>
                </ul>
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #0A0A0A 0%, #1C1C1C 100%); padding: 40px; margin: 40px 0;">
            <div style="color: #F5F5F0; font-size: 20px; font-weight: 600; margin-bottom: 20px; letter-spacing: 1px; text-transform: uppercase;">Available Now</div>
            <div style="color: #F5F5F0; font-size: 16px; line-height: 1.8;">
                <div><strong>Date:</strong> Available Today</div>
                <div><strong>Access:</strong> Inner Circle members</div>
                <div><strong>Location:</strong> ARCSTARZ.com</div>
            </div>
        </div>
        
        <div style="margin-top: 40px; padding: 20px; background: #f8f8f8; border-left: 4px solid #0A0A0A;">
            <p style="font-size: 12px; color: #666; margin: 0;">
                ARCSTARZ<br>
                123 Fashion Avenue, New York, NY 10001<br>
                <a href="https://arcstarz.com/unsubscribe" style="color: #666;">Unsubscribe</a>
            </p>
        </div>
    </div>
</div>`,
    text: `ARCSTARZ - New Collection Available

Introducing our latest limited edition pieces.

Collection Details:
Premium materials and exclusive designs now available.

Features:
- Premium materials
- Limited quantities
- Exclusive designs
- Member pricing

Available Now:
Date: Available Today
Access: Inner Circle members
Location: ARCSTARZ.com

---
ARCSTARZ
123 Fashion Avenue, New York, NY 10001
Unsubscribe: https://arcstarz.com/unsubscribe`
  },
  normal: {
    name: 'General Announcement',
    subject: '📢 ARCSTARZ UPDATE • Important Announcement',
    html: `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: #0A0A0A; padding: 40px 30px; text-align: center; border-bottom: 4px solid #1C1C1C;">
        <div style="font-size: 32px; font-weight: 900; letter-spacing: 4px; color: #F5F5F0; text-transform: uppercase; margin-bottom: 10px;">ARCSTARZ</div>
        <div style="font-size: 12px; letter-spacing: 2px; color: #BFBFBF; text-transform: uppercase;">Luxury Streetwear • Limited Edition</div>
    </div>
    
    <div style="padding: 50px 40px;">
        <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -1px; margin-bottom: 20px; text-transform: uppercase; border-bottom: 3px solid #0A0A0A; padding-bottom: 15px; display: inline-block;">Important Update</h1>
        <p style="font-size: 16px; color: #1C1C1C; margin-bottom: 30px; font-weight: 500;">We have an important announcement for our Inner Circle members.</p>
        
        <div style="background: #F5F5F0; border: 2px solid #0A0A0A; padding: 30px; margin: 30px 0;">
            <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">ANNOUNCEMENT</h2>
            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px;">[Your message content goes here. Replace this with your specific announcement details.]</p>
            
            <div style="background: #0A0A0A; color: #F5F5F0; padding: 20px; margin: 20px 0;">
                <div style="font-size: 16px; font-weight: 700; margin-bottom: 10px; text-transform: uppercase;">Key Points</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                    <li>[Key point 1]</li>
                    <li>[Key point 2]</li>
                    <li>[Key point 3]</li>
                </ul>
            </div>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
            <div style="background: linear-gradient(135deg, #0A0A0A 0%, #1C1C1C 100%); padding: 30px; border-radius: 0;">
                <div style="color: #F5F5F0; font-size: 18px; font-weight: 600; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Next Steps</div>
                <div style="color: #F5F5F0; font-size: 14px; line-height: 1.6;">
                    <div>• Stay tuned for more updates</div>
                    <div>• Check our website regularly</div>
                    <div>• Follow us on social media</div>
                </div>
            </div>
        </div>
    </div>
    
    <div style="background: #0A0A0A; padding: 30px; text-align: center; border-top: 4px solid #1C1C1C;">
        <div style="color: #BFBFBF; font-size: 11px; line-height: 1.8; margin-bottom: 20px;">Thank you for being part of the ARCSTARZ Inner Circle.<br>We appreciate your continued support.</div>
        <div style="color: #F5F5F0; font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">ARCSTARZ</div>
    </div>
</div>`,
    text: `📢 ARCSTARZ UPDATE • Important Announcement

We have an important announcement for our Inner Circle members.

ANNOUNCEMENT
[Your message content goes here. Replace this with your specific announcement details.]

Key Points:
• [Key point 1]
• [Key point 2]
• [Key point 3]

Next Steps:
• Stay tuned for more updates
• Check our website regularly
• Follow us on social media

Thank you for being part of the ARCSTARZ Inner Circle.
We appreciate your continued support.

---
ARCSTARZ
Luxury Streetwear • Limited Edition`
  }
};

export default function AdminEmail() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscribers' | 'campaign' | 'templates' | 'deliverability'>('overview');
  const [campaignForm, setCampaignForm] = useState<CampaignForm>({
    subject: '',
    html: '',
    text: ''
  });
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'drop' | 'normal' | null>(null);
  const [spamCheck, setSpamCheck] = useState<SpamCheck | null>(null);
  const [showSpamWarning, setShowSpamWarning] = useState(false);

  // Check if user is owner
  const isOwner = user?.id === OWNER_ID || user?.email === OWNER_EMAIL;

  useEffect(() => {
    // Wait for auth to load before checking ownership
    if (authLoading) return;
    
    if (!isOwner) {
      router.push('/404');
      return;
    }
    fetchData();
  }, [isOwner, router, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from backend, but handle gracefully if it's not available
      try {
        const [subscribersRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/subscribers`),
          fetch(`${API_URL}/api/subscribers/stats`)
        ]);

        if (subscribersRes.ok && statsRes.ok) {
          const subscribersData = await subscribersRes.json();
          const statsData = await statsRes.json();
          
          setSubscribers(subscribersData.data.subscribers || []);
          setStats(statsData.data || {});
        } else {
          throw new Error('API endpoints not available');
        }
      } catch (fetchError) {
        // Backend not available, use mock data
        console.warn('Backend API not available, using mock data:', fetchError);
        setSubscribers([]);
        setStats({
          total: 0,
          active: 0,
          unsubscribed: 0,
          activePercentage: 0
        });
      }
    } catch (error) {
      console.error('Error fetching admin email data:', error);
      setError('Failed to load email dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const sendCampaign = async () => {
    if (!campaignForm.subject || !campaignForm.html) {
      setError('Subject and HTML content are required');
      return;
    }

    // Check spam score before sending
    const spamResult = checkSpamTriggers(campaignForm.subject, campaignForm.html, campaignForm.text);
    setSpamCheck(spamResult);
    
    if (spamResult.isSpam) {
      setShowSpamWarning(true);
      return;
    }

    try {
      setSendingCampaign(true);
      
      // Optimize email content
      const optimized = optimizeEmail(campaignForm.subject, campaignForm.html, campaignForm.text);
      
      // Try to send via backend, but handle gracefully if it's not available
      try {
        const response = await fetch(`${API_URL}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(optimized),
        });

        const data = await response.json();
        
        if (data.success) {
          alert(`Campaign sent successfully!\nSent: ${data.data.sent}\nFailed: ${data.data.failed}\nTotal: ${data.data.total}`);
          setCampaignForm({ subject: '', html: '', text: '' });
          setSelectedTemplate(null);
          setSpamCheck(null);
        } else {
          setError(data.message || 'Failed to send campaign');
        }
      } catch (fetchError) {
        // Backend not available, show mock success
        console.warn('Backend API not available, simulating campaign send:', fetchError);
        alert('Campaign functionality is not available in demo mode. This would send to all subscribers in production.');
        setCampaignForm({ subject: '', html: '', text: '' });
        setSelectedTemplate(null);
        setSpamCheck(null);
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      setError('Failed to send campaign');
    } finally {
      setSendingCampaign(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setError('Test email address is required');
      return;
    }

    try {
      // Try to send via backend, but handle gracefully if not available
      try {
        const response = await fetch(`${API_URL}/api/test-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ to: testEmail }),
        });

        const data = await response.json();
        
        if (data.success) {
          alert('Test email sent successfully!');
        } else {
          setError(data.message || 'Failed to send test email');
        }
      } catch (fetchError) {
        // Backend not available, show mock success
        console.warn('Backend API not available, simulating test email:', fetchError);
        alert('Test email functionality is not available in demo mode. This would send a test email in production.');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setError('Failed to send test email');
    }
  };

  const useTemplate = (templateType: 'drop' | 'normal') => {
    const template = emailTemplates[templateType];
    setCampaignForm({
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    setSelectedTemplate(templateType);
    setActiveTab('campaign');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Show loading while auth is initializing
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-black border-t-transparent"></div>
                <p className="mt-4 font-body text-sm md:text-base text-black">Loading email management...</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-headline text-2xl md:text-4xl tracking-tight mb-2 text-black">Email Command Center</h1>
                <p className="font-body text-black/60 text-sm md:text-base">ARCSTARZ Inner Circle Management</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs md:text-sm font-body font-medium text-green-600">Online</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-600 text-red-700 rounded">
              <div className="flex items-center justify-between">
                <span className="font-body font-semibold">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 font-bold text-xl"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="bg-white border border-black/10 p-4 md:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline text-xl md:text-2xl tracking-tight text-black">{stats.total}</h3>
                    <p className="font-body text-xs md:text-sm text-black/60 mt-1">Total</p>
                  </div>
                  <div className="text-xl md:text-2xl">👥</div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 md:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline text-xl md:text-2xl tracking-tight text-green-800">{stats.active}</h3>
                    <p className="font-body text-xs md:text-sm text-green-600 mt-1">Active</p>
                  </div>
                  <div className="text-xl md:text-2xl">✅</div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 md:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline text-xl md:text-2xl tracking-tight text-red-800">{stats.unsubscribed}</h3>
                    <p className="font-body text-xs md:text-sm text-red-600 mt-1">Unsub</p>
                  </div>
                  <div className="text-xl md:text-2xl">❌</div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 md:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline text-xl md:text-2xl tracking-tight text-blue-800">{stats.activePercentage}%</h3>
                    <p className="font-body text-xs md:text-sm text-blue-600 mt-1">Rate</p>
                  </div>
                  <div className="text-xl md:text-2xl">📊</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white border border-black/10 mb-6 md:mb-8 overflow-x-auto">
            <div className="flex min-w-max md:min-w-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-4 md:px-6 py-3 md:py-4 font-body text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-black text-white border-b-2 border-black'
                    : 'text-black hover:bg-gray-50 border-b-2 border-transparent'
                }`}
              >
                🏠 Overview
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex-1 px-4 md:px-6 py-3 md:py-4 font-body text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'templates'
                    ? 'bg-black text-white border-b-2 border-black'
                    : 'text-black hover:bg-gray-50 border-b-2 border-transparent'
                }`}
              >
                📧 Templates
              </button>
              <button
                onClick={() => setActiveTab('campaign')}
                className={`flex-1 px-4 md:px-6 py-3 md:py-4 font-body text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'campaign'
                    ? 'bg-black text-white border-b-2 border-black'
                    : 'text-black hover:bg-gray-50 border-b-2 border-transparent'
                }`}
              >
                🚀 Campaign
              </button>
              <button
                onClick={() => setActiveTab('subscribers')}
                className={`flex-1 px-4 md:px-6 py-3 md:py-4 font-body text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'subscribers'
                    ? 'bg-black text-white border-b-2 border-black'
                    : 'text-black hover:bg-gray-50 border-b-2 border-transparent'
                }`}
              >
                👥 List ({subscribers.length})
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border-2 border-[#0A0A0A] p-8">
                <h2 className="font-headline text-2xl tracking-tight mb-6 flex items-center">
                  <span className="mr-3">🎯</span> Quick Actions
                </h2>
                <div className="space-y-4">
                  <button
                    onClick={() => useTemplate('drop')}
                    className="w-full text-left p-4 border-2 border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-headline text-lg font-semibold">🔥 Product Drop</h3>
                        <p className="font-body text-sm opacity-75">Send limited edition drop announcement</p>
                      </div>
                      <div className="text-2xl group-hover:scale-110 transition-transform">→</div>
                    </div>
                  </button>
                  <button
                    onClick={() => useTemplate('normal')}
                    className="w-full text-left p-4 border-2 border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-headline text-lg font-semibold">📢 General Message</h3>
                        <p className="font-body text-sm opacity-75">Send general announcement or update</p>
                      </div>
                      <div className="text-2xl group-hover:scale-110 transition-transform">→</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('campaign')}
                    className="w-full text-left p-4 border-2 border-blue-600 hover:bg-blue-600 hover:text-white transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-headline text-lg font-semibold">✏️ Custom Campaign</h3>
                        <p className="font-body text-sm opacity-75">Create custom email campaign</p>
                      </div>
                      <div className="text-2xl group-hover:scale-110 transition-transform">→</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white border-2 border-[#0A0A0A] p-8">
                <h2 className="font-headline text-2xl tracking-tight mb-6 flex items-center">
                  <span className="mr-3">📊</span> Recent Activity
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div>
                      <div className="font-body font-semibold">Latest Subscriber</div>
                      <div className="font-body text-sm text-[#1C1C1C]">{subscribers[0]?.email || 'No subscribers yet'}</div>
                    </div>
                    <div className="text-2xl">👤</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div>
                      <div className="font-body font-semibold">Active Subscribers</div>
                      <div className="font-body text-sm text-[#1C1C1C]">{stats?.active || 0} ready to receive campaigns</div>
                    </div>
                    <div className="text-2xl">✅</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div>
                      <div className="font-body font-semibold">System Status</div>
                      <div className="font-body text-sm text-green-600">All systems operational</div>
                    </div>
                    <div className="text-2xl">🟢</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div>
                      <div className="font-body font-semibold">Memory Storage</div>
                      <div className="font-body text-sm text-[#1C1C1C]">Active - {subscribers.length} subscribers</div>
                    </div>
                    <div className="text-2xl">💾</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Object.entries(emailTemplates).map(([key, template]) => (
                <div key={key} className="bg-white border-2 border-[#0A0A0A] overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-[#0A0A0A] text-white p-6">
                    <h3 className="font-headline text-xl tracking-tight mb-2">{template.name}</h3>
                    <p className="font-body text-sm opacity-90">{template.subject}</p>
                  </div>
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="font-body text-sm font-semibold mb-2">Preview:</div>
                      <div className="bg-gray-50 p-4 rounded max-h-32 overflow-y-auto">
                        <div className="font-body text-xs text-[#1C1C1C]">
                          {template.text.substring(0, 200)}...
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => useTemplate(key as 'drop' | 'normal')}
                        className="flex-1 px-4 py-3 bg-[#0A0A0A] text-white font-body font-semibold hover:bg-[#1C1C1C] transition-colors"
                      >
                        ✏️ Use This Template
                      </button>
                      <button
                        onClick={() => setActiveTab('campaign')}
                        className="flex-1 px-4 py-3 border-2 border-[#0A0A0A] font-body font-semibold hover:bg-[#0A0A0A] hover:text-white transition-colors"
                      >
                        📧 Customize & Send
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Campaign Tab */}
          {activeTab === 'campaign' && (
            <div className="space-y-8">
              {selectedTemplate && (
                <div className="bg-green-50 border-2 border-green-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-body font-semibold text-green-800">
                        Template Loaded: {emailTemplates[selectedTemplate].name}
                      </div>
                      <div className="font-body text-sm text-green-600">
                        You can customize the content below before sending
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="text-green-600 hover:text-green-800 font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white border-2 border-[#0A0A0A] p-8">
                <h2 className="font-headline text-2xl tracking-tight mb-6 flex items-center">
                  <span className="mr-3">🚀</span> Campaign Composer
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block font-body text-sm font-semibold mb-3">Subject Line</label>
                    <input
                      type="text"
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full p-4 border-2 border-[#0A0A0A] font-body text-lg focus:outline-none focus:border-[#1C1C1C]"
                      placeholder="Enter email subject..."
                    />
                  </div>

                  <div>
                    <label className="block font-body text-sm font-semibold mb-3">HTML Content</label>
                    <textarea
                      value={campaignForm.html}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, html: e.target.value }))}
                      className="w-full p-4 border-2 border-[#0A0A0A] font-body h-48 focus:outline-none focus:border-[#1C1C1C]"
                      placeholder="Enter HTML email content..."
                    />
                  </div>

                  <div>
                    <label className="block font-body text-sm font-semibold mb-3">Text Content (Optional)</label>
                    <textarea
                      value={campaignForm.text}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, text: e.target.value }))}
                      className="w-full p-4 border-2 border-[#0A0A0A] font-body h-32 focus:outline-none focus:border-[#1C1C1C]"
                      placeholder="Enter plain text version..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={sendCampaign}
                      disabled={sendingCampaign}
                      className="flex-1 px-6 py-4 bg-[#0A0A0A] text-white font-body font-bold text-lg hover:bg-[#1C1C1C] transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {sendingCampaign ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Sending Campaign...
                        </>
                      ) : (
                        <>
                          📧 Send to {stats?.active || 0} Active Subscribers
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-blue-600 p-8">
                <h3 className="font-headline text-xl tracking-tight mb-6 flex items-center">
                  <span className="mr-3">🧪</span> Test Email
                </h3>
                <div className="flex gap-4">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 p-4 border-2 border-blue-600 font-body focus:outline-none focus:border-blue-800"
                    placeholder="Enter test email address..."
                  />
                  <button
                    onClick={sendTestEmail}
                    className="px-6 py-4 bg-blue-600 text-white font-body font-semibold hover:bg-blue-700 transition-colors"
                  >
                    🧪 Send Test
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subscribers Tab */}
          {activeTab === 'subscribers' && (
            <div className="bg-white border-2 border-[#0A0A0A]">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-headline text-2xl tracking-tight flex items-center">
                    <span className="mr-3">👥</span> All Subscribers
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-body">
                      <span className="font-semibold">{subscribers.length}</span> total subscribers
                    </div>
                    <button
                      onClick={fetchData}
                      className="px-4 py-2 bg-[#0A0A0A] text-white font-body text-sm font-semibold hover:bg-[#1C1C1C] transition-colors"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#0A0A0A]">
                        <th className="text-left p-4 font-body text-sm font-bold uppercase tracking-wide">Email</th>
                        <th className="text-left p-4 font-body text-sm font-bold uppercase tracking-wide">Status</th>
                        <th className="text-left p-4 font-body text-sm font-bold uppercase tracking-wide">Subscribed</th>
                        <th className="text-left p-4 font-body text-sm font-bold uppercase tracking-wide">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((subscriber) => (
                        <tr key={subscriber._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-4 font-body text-sm">{subscriber.email}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                              subscriber.subscribed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {subscriber.subscribed ? '✅ Active' : '❌ Unsubscribed'}
                            </span>
                          </td>
                          <td className="p-4 font-body text-sm">
                            {subscriber.subscribedAt ? formatDate(subscriber.subscribedAt) : 'N/A'}
                          </td>
                          <td className="p-4 font-body text-sm">
                            {formatDate(subscriber.updatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
