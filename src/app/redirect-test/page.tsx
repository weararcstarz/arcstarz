'use client';

import { useEffect, useState } from 'react';

export default function RedirectTest() {
  const [redirectUri, setRedirectUri] = useState('');

  useEffect(() => {
    const uri = `${window.location.origin}/api/auth/google`;
    setRedirectUri(uri);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl mb-8">Redirect URI Test</h1>
        
        <div className="border-4 border-[#0A0A0A] p-6 mb-8">
          <h2 className="font-headline text-xl mb-4">Current Redirect URI:</h2>
          <div className="font-mono text-lg bg-gray-100 p-4 rounded">
            {redirectUri}
          </div>
        </div>

        <div className="border-4 border-[#BFBFBF] p-6">
          <h2 className="font-headline text-xl mb-4">What to Add to Google Console:</h2>
          <div className="space-y-4">
            <p className="font-body">Add this EXACT URI to your Google OAuth app:</p>
            <div className="font-mono text-lg bg-red-100 p-4 rounded border-2 border-red-500">
              {redirectUri}
            </div>
            <p className="font-body text-sm">Make sure it matches EXACTLY - no extra slashes, no https instead of http</p>
          </div>
        </div>

        <div className="mt-8 p-6 border-4 border-[#0A0A0A]">
          <h2 className="font-headline text-xl mb-4">Steps to Fix:</h2>
          <ol className="font-body space-y-2 list-decimal list-inside">
            <li>Go to Google Cloud Console</li>
            <li>Navigate to APIs & Services → Credentials</li>
            <li>Click on your OAuth 2.0 Client ID</li>
            <li>Scroll to "Authorized redirect URIs"</li>
            <li>Click "ADD URI"</li>
            <li>Paste: {redirectUri}</li>
            <li>Click "Save"</li>
            <li>Wait 2-3 minutes for changes to propagate</li>
            <li>Try Google login again</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
