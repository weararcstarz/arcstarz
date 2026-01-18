'use client';

import { useState } from 'react';

export default function TestOAuth() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testEnvVars = async () => {
    addLog('Testing environment variables...');
    const response = await fetch('/api/test-env');
    const data = await response.json();
    addLog(`Client ID: ${data.clientId}`);
    addLog(`Client Secret exists: ${data.clientSecretExists}`);
  };

  const testGoogleAuth = async () => {
    addLog('Testing Google OAuth...');
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    addLog(`Client ID from browser: ${clientId}`);
    
    if (!clientId) {
      addLog('ERROR: Client ID not found');
      return;
    }

    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/google`);
    const scope = encodeURIComponent('openid email profile');
    const state = encodeURIComponent(Date.now().toString());
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    addLog(`Auth URL: ${authUrl.substring(0, 100)}...`);
    addLog('Redirecting to Google...');
    
    // window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl mb-8">Google OAuth Debug</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testEnvVars}
            className="btn-primary px-6 py-3"
          >
            Test Environment Variables
          </button>
          
          <button
            onClick={testGoogleAuth}
            className="btn-primary px-6 py-3 ml-4"
          >
            Test Google Auth URL
          </button>
        </div>

        <div className="border-4 border-[#0A0A0A] p-6">
          <h2 className="font-headline text-xl mb-4">Debug Logs:</h2>
          <div className="font-mono text-sm space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="border-b border-gray-300 pb-2">
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-6 border-4 border-[#BFBFBF]">
          <h2 className="font-headline text-xl mb-4">Required Setup:</h2>
          <ul className="font-body space-y-2">
            <li>• Add this redirect URI to Google Cloud Console:</li>
            <li className="font-mono text-sm ml-4">http://localhost:3000/api/auth/google</li>
            <li>• Make sure OAuth consent screen is configured</li>
            <li>• Ensure Google+ API is enabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
