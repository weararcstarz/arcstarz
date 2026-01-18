'use client';

import { useEffect, useState } from 'react';

export default function ClientEnvTest() {
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    // Test client-side environment variable
    const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    setClientId(id || 'NOT_FOUND');
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl mb-8">Client Environment Test</h1>
        
        <div className="border-4 border-[#0A0A0A] p-6">
          <h2 className="font-headline text-xl mb-4">Client-Side Environment Variables:</h2>
          <div className="font-mono text-sm space-y-2">
            <p>NEXT_PUBLIC_GOOGLE_CLIENT_ID: {clientId}</p>
          </div>
        </div>

        {clientId !== 'NOT_FOUND' && (
          <div className="mt-8">
            <button
              onClick={() => {
                const redirectUri = `${window.location.origin}/api/auth/google`;
                const scope = 'openid email profile';
                const state = Date.now().toString();
                
                const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                  `client_id=${clientId}&` +
                  `redirect_uri=${encodeURIComponent(redirectUri)}` +
                  `response_type=code&` +
                  `scope=${encodeURIComponent(scope)}` +
                  `state=${state}&` +
                  `access_type=offline&` +
                  `prompt=consent`;
                
                console.log('Testing redirect to:', authUrl);
                window.location.href = authUrl;
              }}
              className="btn-primary px-6 py-3"
            >
              Test Google Redirect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
