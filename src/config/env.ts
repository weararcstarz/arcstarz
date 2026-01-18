// Environment variable validation for production
interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_BASE_URL?: string;
  FRONTEND_URL?: string;
  MONGODB_URI?: string;
  JWT_SECRET?: string;
  BCRYPT_ROUNDS?: number;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'NODE_ENV',
  'PORT',
  'EMAIL_USER',
  'EMAIL_PASS'
];

const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const validateEnv = (): EnvConfig => {
  const config: Partial<EnvConfig> = {};
  const missing: string[] = [];

  // Check required environment variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      missing.push(envVar);
    } else {
      config[envVar] = value as any;
    }
  }

  // Fail fast if required environment variables are missing
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    console.error('\nPlease set these environment variables and restart the server.');
    process.exit(1);
  }

  // Parse and validate specific variables
  config.PORT = parseNumber(process.env.PORT, 3001);
  config.BCRYPT_ROUNDS = parseNumber(process.env.BCRYPT_ROUNDS, 12);

  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(config.NODE_ENV!)) {
    console.error('❌ Invalid NODE_ENV. Must be "development", "production", or "test"');
    process.exit(1);
  }

  // Validate port range
  if (config.PORT! < 1 || config.PORT! > 65535) {
    console.error('❌ Invalid PORT. Must be between 1 and 65535');
    process.exit(1);
  }

  // Optional environment variables
  config.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
  config.NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  config.FRONTEND_URL = process.env.FRONTEND_URL;
  config.MONGODB_URI = process.env.MONGODB_URI;
  config.JWT_SECRET = process.env.JWT_SECRET;

  // Production-specific validations
  if (config.NODE_ENV === 'production') {
    if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
      console.error('❌ JWT_SECRET must be at least 32 characters in production');
      process.exit(1);
    }

    if (!config.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not set - using memory storage');
    }

    if (config.EMAIL_USER?.includes('example') || config.EMAIL_PASS?.includes('example')) {
      console.error('❌ Production email credentials cannot be example values');
      process.exit(1);
    }
  }

  return config as EnvConfig;
};

// Export validated configuration
export const env = validateEnv();

// Log configuration (without sensitive data)
if (env.NODE_ENV === 'development') {
  console.log('🔧 Environment Configuration:');
  console.log(`  NODE_ENV: ${env.NODE_ENV}`);
  console.log(`  PORT: ${env.PORT}`);
  console.log(`  EMAIL_USER: ${env.EMAIL_USER}`);
  console.log(`  MONGODB_URI: ${env.MONGODB_URI ? '✅ Set' : '❌ Not set'}`);
  console.log(`  JWT_SECRET: ${env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
} else {
  console.log('✅ Environment configuration validated');
}

export default env;
