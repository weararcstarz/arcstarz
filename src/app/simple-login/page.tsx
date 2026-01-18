'use client';

import { useState } from 'react';

export default function SimpleLogin() {
  const [email, setEmail] = useState('bashirali652@icloud.com');
  const [password, setPassword] = useState('admin123');
  const [result, setResult] = useState('');

  const handleTestEndpoint = async () => {
    try {
      const response = await fetch('/api/test-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      });
      const data = await response.json();
      setResult(`Test endpoint success: ${JSON.stringify(data)}`);
    } catch (error) {
      setResult(`Test endpoint error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSecureLogin = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/secure-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      setResult(`Direct backend success: ${JSON.stringify(data)}`);
    } catch (error) {
      setResult(`Direct backend error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleNextLogin = async () => {
    try {
      const response = await fetch('/api/users/secure-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      setResult(`Next API success: ${JSON.stringify(data)}`);
    } catch (error) {
      setResult(`Next API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Simple Login Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleTestEndpoint} style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none' }}>
          Test Next.js API
        </button>
        <button onClick={handleSecureLogin} style={{ padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none' }}>
          Test Direct Backend
        </button>
        <button onClick={handleNextLogin} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none' }}>
          Test Next Secure Login
        </button>
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <strong>Result:</strong>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{result}</pre>
      </div>
    </div>
  );
}
