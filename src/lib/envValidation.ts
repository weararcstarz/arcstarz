interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  NEXT_PUBLIC_BASE_URL: string;
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  OWNER_ID: string;
  OWNER_EMAIL: string;
  OWNER_TOKEN: string;
  JWT_SECRET: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  ENCRYPTION_KEY: string;
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

function validateRequiredEnvVar(key: string, value?: string): string {
  if (!value) {
    throw new EnvValidationError(`Missing required environment variable: ${key}`);
  }
  return value;
}

function validatePort(value?: string): number {
  const port = parseInt(value || '3001', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new EnvValidationError(`Invalid PORT: must be between 1 and 65535`);
  }
  return port;
}

function validateEmail(value?: string): string {
  const email = validateRequiredEnvVar('EMAIL_USER', value);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new EnvValidationError(`Invalid EMAIL_USER format`);
  }
  return email;
}

function validateUrl(key: string, value?: string): string {
  const url = validateRequiredEnvVar(key, value);
  try {
    new URL(url);
  } catch {
    throw new EnvValidationError(`Invalid ${key}: must be a valid URL`);
  }
  return url;
}

function validateStripeKeys(): { publishable: string; secret: string } {
  const publishable = validateRequiredEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const secret = validateRequiredEnvVar('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY);
  
  if (!publishable.startsWith('pk_')) {
    throw new EnvValidationError('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_');
  }
  
  if (!secret.startsWith('sk_')) {
    throw new EnvValidationError('STRIPE_SECRET_KEY must start with sk_');
  }
  
  // Ensure we're not using live keys in development
  if (process.env.NODE_ENV === 'development' && (publishable.includes('live') || secret.includes('live'))) {
    throw new EnvValidationError('Cannot use live Stripe keys in development environment');
  }
  
  return { publishable, secret };
}

function validatePayPalKeys(): { clientId: string; secret: string } {
  const clientId = validateRequiredEnvVar('NEXT_PUBLIC_PAYPAL_CLIENT_ID', process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);
  const secret = validateRequiredEnvVar('PAYPAL_CLIENT_SECRET', process.env.PAYPAL_CLIENT_SECRET);
  
  if (clientId.length < 10) {
    throw new EnvValidationError('NEXT_PUBLIC_PAYPAL_CLIENT_ID appears to be invalid');
  }
  
  if (secret.length < 10) {
    throw new EnvValidationError('PAYPAL_CLIENT_SECRET appears to be invalid');
  }
  
  return { clientId, secret };
}

function validateJwtSecret(): string {
  const secret = validateRequiredEnvVar('JWT_SECRET', process.env.JWT_SECRET);
  
  if (secret.length < 32) {
    throw new EnvValidationError('JWT_SECRET must be at least 32 characters long');
  }
  
  if (secret === 'your-super-secret-jwt-key-change-in-production') {
    if (process.env.NODE_ENV === 'production') {
      throw new EnvValidationError('JWT_SECRET must be changed from default value in production');
    }
  }
  
  return secret;
}

function validateEncryptionKey(): string {
  const key = validateRequiredEnvVar('ENCRYPTION_KEY', process.env.ENCRYPTION_KEY);
  
  if (key.length < 64) {
    throw new EnvValidationError('ENCRYPTION_KEY must be at least 64 characters (32 bytes) for AES-256');
  }
  
  return key;
}

export function validateEnvironment(): EnvConfig {
  try {
    const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['NODE_ENV'];
    const port = validatePort(process.env.PORT);
    
    const stripeKeys = validateStripeKeys();
    const paypalKeys = validatePayPalKeys();
    
    const config: EnvConfig = {
      NODE_ENV: nodeEnv,
      PORT: port,
      NEXT_PUBLIC_BASE_URL: validateUrl('NEXT_PUBLIC_BASE_URL', process.env.NEXT_PUBLIC_BASE_URL),
      NEXT_PUBLIC_API_URL: validateUrl('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL),
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stripeKeys.publishable,
      STRIPE_SECRET_KEY: stripeKeys.secret,
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: paypalKeys.clientId,
      PAYPAL_CLIENT_SECRET: paypalKeys.secret,
      OWNER_ID: validateRequiredEnvVar('OWNER_ID', process.env.OWNER_ID),
      OWNER_EMAIL: validateEmail(process.env.OWNER_EMAIL),
      OWNER_TOKEN: validateRequiredEnvVar('OWNER_TOKEN', process.env.OWNER_TOKEN),
      JWT_SECRET: validateJwtSecret(),
      EMAIL_USER: validateEmail(process.env.EMAIL_USER),
      EMAIL_PASS: validateRequiredEnvVar('EMAIL_PASS', process.env.EMAIL_PASS),
      ENCRYPTION_KEY: validateEncryptionKey()
    };

    // Production-specific validations
    if (nodeEnv === 'production') {
      if (config.NEXT_PUBLIC_BASE_URL.includes('localhost') || config.NEXT_PUBLIC_API_URL.includes('localhost')) {
        throw new EnvValidationError('Cannot use localhost URLs in production');
      }
      
      if (config.EMAIL_PASS === 'nbum rurr wyxb tzmv') {
        throw new EnvValidationError('EMAIL_PASS must be changed from default value in production');
      }
    }

    return config;
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error('❌ Environment Validation Error:', error.message);
      process.exit(1);
    }
    throw error;
  }
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

// Export validated config for use throughout the app
export const env = validateEnvironment();
