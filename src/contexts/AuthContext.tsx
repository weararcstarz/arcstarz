'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { updateUserLastLogin, addNewUser } from '@/utils/userManager';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
  : 'http://localhost:3001';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true, // Start as true to check for existing session
    error: null,
  });

  useEffect(() => {
    initializeUserDatabase();
    
    // Check for Google OAuth callback FIRST - before session restoration
    const urlParams = new URLSearchParams(window.location.search);
    const googleLogin = urlParams.get('google_login');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');
    const stateParam = urlParams.get('state');
    
    // Check if we've already processed this callback
    const callbackProcessed = sessionStorage.getItem('google_callback_processed');
    
    if (googleLogin === 'success' && userParam && !callbackProcessed) {
      // Mark callback as processed to prevent infinite loop
      sessionStorage.setItem('google_callback_processed', 'true');
      
      // Verify state to prevent CSRF attacks - more robust handling
      const storedState = sessionStorage.getItem('google_oauth_state');
      console.log('OAuth State Check:', { storedState, stateParam, hasStoredState: !!storedState });
      
      // Handle different scenarios for state validation
      if (!storedState) {
        console.warn('No stored state found - possible session expiration or mobile OAuth issue');
        // For mobile compatibility, proceed with caution but log the issue
        // In production, you might want to be stricter here
      } else if (storedState !== stateParam) {
        console.error('Invalid OAuth state - possible CSRF attack');
        console.log('Expected:', storedState);
        console.log('Received:', stateParam);
        // Clean up and redirect to login with error
        sessionStorage.removeItem('google_oauth_state');
        sessionStorage.removeItem('google_callback_processed');
        setAuthState(prev => ({
          ...prev,
          error: 'Invalid OAuth state - please try again',
          isLoading: false,
        }));
        // Redirect to login page with error
        window.location.href = '/login?error=invalid_state';
        return;
      }
      
      // Clean up state
      sessionStorage.removeItem('google_oauth_state');
      
      try {
        const user = JSON.parse(atob(userParam));
        
        // Validate user data
        if (!user.id || !user.email || !user.name) {
          throw new Error('Invalid user data received from Google');
        }
        
        // Store user in localStorage for persistent sessions
        localStorage.setItem('arcstarz_user', JSON.stringify(user));
        
        // Add to permanent user database
        addUserToDatabase({
          ...user,
          registrationType: 'google',
          registrationSource: 'google_oauth',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });
        
        // Update user management system
        updateUserLastLogin(user.id);
        
        // Also store session timestamp for session management
        localStorage.setItem('arcstarz_session', JSON.stringify({
          loginTime: Date.now(),
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        }));
        
        setAuthState({ user, isLoading: false, error: null });
        
        // Clean up URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('Google OAuth callback successful:', user);
        
        // Redirect to shop after successful login
        window.location.href = '/shop';
        return; // Exit early to prevent session restoration
      } catch (parseError) {
        console.error('Failed to parse Google user data:', parseError);
        setAuthState(prev => ({
          ...prev,
          error: 'Failed to process Google login - please try again',
          isLoading: false,
        }));
        return; // Exit early
      }
    } else if (error) {
      const errorMessage = decodeURIComponent(error);
      console.error('Google OAuth error:', errorMessage);
      setAuthState(prev => ({
        ...prev,
        error: `Google login failed: ${errorMessage}`,
        isLoading: false,
      }));
      // Don't return - still check session
    } else if (stateParam && !userParam) {
      // State present but no user - likely user denied access
      console.log('User denied Google OAuth access');
      setAuthState(prev => ({
        ...prev,
        error: 'Google login was cancelled',
        isLoading: false,
      }));
      // Don't return - still check session
    }

    // Check for existing session (unless we just processed OAuth callback successfully)
    if (!(googleLogin === 'success' && userParam && !callbackProcessed)) {
      const checkSession = () => {
        const savedUser = localStorage.getItem('arcstarz_user');
        const savedSession = localStorage.getItem('arcstarz_session');
        
        console.log('Checking session - Saved user:', !!savedUser);
        console.log('Checking session - Saved session:', !!savedSession);
        
        if (savedUser && savedSession) {
          try {
            const user = JSON.parse(savedUser);
            const session = JSON.parse(savedSession);
            
            console.log('Session data:', session);
            
            // Check if session is still valid (30 days)
            if (session.expiresAt > Date.now()) {
              console.log('Session valid, setting user state:', user);
              setAuthState({ user, isLoading: false, error: null });
              console.log('Persistent session restored for:', user.email);
            } else {
              // Session expired, clean up
              localStorage.removeItem('arcstarz_user');
              localStorage.removeItem('arcstarz_session');
              console.log('Session expired, cleaned up');
              setAuthState({ user: null, isLoading: false, error: null });
            }
          } catch (error) {
            console.error('Session restoration error:', error);
            localStorage.removeItem('arcstarz_user');
            localStorage.removeItem('arcstarz_session');
            setAuthState({ user: null, isLoading: false, error: null });
          }
        } else if (savedUser) {
          // Legacy session without timestamp, create one
          try {
            const user = JSON.parse(savedUser);
            localStorage.setItem('arcstarz_session', JSON.stringify({
              loginTime: Date.now(),
              expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
            }));
            console.log('Setting user state for legacy session:', user);
            setAuthState({ user, isLoading: false, error: null });
            console.log('Legacy session upgraded for:', user.email);
          } catch (error) {
            console.error('Legacy session error:', error);
            localStorage.removeItem('arcstarz_user');
            localStorage.removeItem('arcstarz_session');
            setAuthState({ user: null, isLoading: false, error: null });
          }
        } else {
          // No session found
          console.log('No session found, user not authenticated');
          setAuthState({ user: null, isLoading: false, error: null });
        }
      };

      checkSession();
    }
  }, []);

  // Initialize user database
  const initializeUserDatabase = () => {
    if (!localStorage.getItem('arcstarz_user_database')) {
      const ownerAccount = {
        id: '1767942289962',
        email: 'bashirali652@icloud.com',
        name: 'ARCSTARZ Owner',
        password: 'admin123',
        registrationType: 'system',
        registrationSource: 'owner_account',
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: new Date().toISOString(),
        isActive: true,
        isOwner: true
      };
      
      localStorage.setItem('arcstarz_user_database', JSON.stringify([ownerAccount]));
      console.log('User database initialized with owner account');
    }
  };

  // Add user to permanent database
  const addUserToDatabase = (userData: any) => {
    // Send to Node.js backend instead of localStorage
    fetch(`${API_URL}/api/users/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('User added to backend database:', userData.email);
        
        // Trigger storage event for admin dashboard
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'arcstarz_user_database',
          newValue: JSON.stringify([data.user])
        }));
      } else {
        console.error('Failed to add user to backend:', data.error);
      }
    })
    .catch(error => {
      console.error('Error adding user to backend:', error);
    });
  };

  const loginWithGoogle = async () => {
    console.log('Initiating Google OAuth flow');
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }
      
      // Use current origin for redirect URI - works on both mobile and desktop
      const redirectUri = `${window.location.origin}/api/auth/google`;
      const scope = 'openid email profile';
      const state = Date.now().toString() + Math.random().toString(36).substring(2);
      
      console.log('Redirect URI:', redirectUri);
      console.log('Client ID:', clientId);
      console.log('User Agent:', navigator.userAgent);
      console.log('Generated state:', state);
      
      // Clear any existing callback flag and state to ensure clean start
      sessionStorage.removeItem('google_callback_processed');
      sessionStorage.removeItem('google_oauth_state');
      
      // Store state with timestamp for debugging
      sessionStorage.setItem('google_oauth_state', state);
      sessionStorage.setItem('google_oauth_state_timestamp', Date.now().toString());
      
      // Construct Google OAuth URL with proper parameter order
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scope,
        state: state,
        access_type: 'offline',
        prompt: 'consent',
      });
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      console.log('Auth URL:', authUrl);
      console.log('Redirecting to Google OAuth...');
      
      // Redirect to Google OAuth - works on both mobile and desktop
      // The redirect happens immediately, so we don't need to wait
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Google login error:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initiate Google login',
        isLoading: false,
      }));
    }
  };

  const login = async (credentials: LoginCredentials) => {
    console.log('Login attempt:', credentials.email);
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Send login to secure endpoint
      const response = await fetch(`${API_URL}/api/users/secure-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }
      
      console.log('Login successful on backend:', data.user);
      
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        isOwner: data.user.isOwner,
      };
      
      // Store user in localStorage for persistent sessions
      localStorage.setItem('arcstarz_user', JSON.stringify(user));
      
      // Also store session timestamp for session management
      localStorage.setItem('arcstarz_session', JSON.stringify({
        loginTime: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      }));
      
      setAuthState({ user, isLoading: false, error: null });
      console.log('User login successful:', user);
      
      // Trigger storage event for admin dashboard
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'arcstarz_user_database',
        newValue: JSON.stringify([data.user])
      }));
      
      // Update user management system
      updateUserLastLogin(data.user.id);
      
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    console.log('=== NODE.JS REGISTRATION SYSTEM ===');
    console.log('Registration attempt:', credentials.email);
    console.log('Name:', credentials.name);
    console.log('Email:', credentials.email);
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Validate passwords match
      if (credentials.password !== credentials.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Send registration to Node.js backend
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
          registrationType: 'email',
          registrationSource: 'registration_form'
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }
      
      console.log('Registration successful on backend:', data.user);
      
      // Auto-login after registration
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      };
      
      // Store user in localStorage for persistent sessions
      localStorage.setItem('arcstarz_user', JSON.stringify(user));
      
      // Also store session timestamp for session management
      localStorage.setItem('arcstarz_session', JSON.stringify({
        loginTime: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      }));
      
      setAuthState({ user, isLoading: false, error: null });
      console.log('Registration complete:', user);
      console.log('=== NODE.JS REGISTRATION COMPLETE ===');
      
      // Trigger storage event for admin dashboard
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'arcstarz_user_database',
        newValue: JSON.stringify([data.user])
      }));
      
      // Add new user to management system
      addNewUser({
        email: data.user.email,
        name: data.user.name,
        password: data.user.password,
        registrationType: 'email',
        registrationSource: 'registration_form',
        isActive: true,
        isOwner: false
      });
      
      // Redirect to shop after successful registration
      window.location.href = '/shop';
    } catch (error) {
      console.error('Registration error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
    }
  };

  const logout = () => {
    localStorage.removeItem('arcstarz_user');
    localStorage.removeItem('arcstarz_session');
    sessionStorage.removeItem('google_callback_processed');
    setAuthState({ user: null, isLoading: false, error: null });
    console.log('User logged out, session cleared');
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const value: AuthContextType = {
    ...authState,
    login,
    loginWithGoogle,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
