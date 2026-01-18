'use client';

import { useEffect, useState } from 'react';
import { SessionData } from '@/types/common';

export default function SessionTest() {
  const [sessionData, setSessionData] = useState<SessionData>({
    savedUser: null,
    savedSession: null,
    rawUser: null,
    rawSession: null,
  });

  useEffect(() => {
    const checkSession = () => {
      const savedUser = localStorage.getItem('arcstarz_user');
      const savedSession = localStorage.getItem('arcstarz_session');
      
      setSessionData({
        savedUser: savedUser ? JSON.parse(savedUser) : null,
        savedSession: savedSession ? JSON.parse(savedSession) : null,
        rawUser: savedUser,
        rawSession: savedSession,
      });
    };

    checkSession();
    
    // Update every second to see changes
    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-headline text-3xl mb-8">Session Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-4 border-[#0A0A0A] p-6">
            <h2 className="font-headline text-xl mb-4">User Data</h2>
            <pre className="font-mono text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(sessionData.savedUser, null, 2)}
            </pre>
          </div>
          
          <div className="border-4 border-[#0A0A0A] p-6">
            <h2 className="font-headline text-xl mb-4">Session Data</h2>
            <pre className="font-mono text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(sessionData.savedSession, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-8 border-4 border-[#BFBFBF] p-6">
          <h2 className="font-headline text-xl mb-4">Raw Storage</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-subtitle text-sm mb-2">arcstarz_user:</h3>
              <pre className="font-mono text-xs bg-gray-100 p-4 rounded overflow-auto max-h-32">
                {sessionData.rawUser || 'NULL'}
              </pre>
            </div>
            <div>
              <h3 className="font-subtitle text-sm mb-2">arcstarz_session:</h3>
              <pre className="font-mono text-xs bg-gray-100 p-4 rounded overflow-auto max-h-32">
                {sessionData.rawSession || 'NULL'}
              </pre>
            </div>
          </div>
        </div>

        <div className="mt-8 space-x-4">
          <button
            onClick={() => {
              localStorage.removeItem('arcstarz_user');
              localStorage.removeItem('arcstarz_session');
              window.location.reload();
            }}
            className="btn-primary"
          >
            Clear Session
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary bg-transparent text-[#0A0A0A] border-2 border-[#0A0A0A]"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
