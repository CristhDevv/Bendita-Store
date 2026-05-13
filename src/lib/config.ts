/**
 * Application Configuration
 * 
 * This module exports validated environment variables. 
 * If a required variable is missing in production, it will throw an error early.
 */

const getEnv = (key: string, required = true) => {
  const value = process.env[key];
  const isProd = process.env.NODE_ENV === 'production';
  // Allow missing variables during build phase to avoid build failures
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || process.env.BUILD_ID;
  
  if (required && !value && isProd && !isBuild) {
    throw new Error(`CRITICAL CONFIG ERROR: Missing environment variable ${key}. Application cannot start in production.`);
  }
  return value || '';
};

export const CONFIG = {
  SUPABASE: {
    URL: getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    ANON_KEY: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    SERVICE_ROLE: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  SITE: {
    URL: getEnv('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000',
    WHATSAPP: getEnv('NEXT_PUBLIC_WHATSAPP_NUMBER'),
  },
  STORAGE: {
    // Derived from SUPABASE_URL
    PUBLIC_URL: `${getEnv('NEXT_PUBLIC_SUPABASE_URL')}/storage/v1/object/public/`,
  }
} as const;

// Simple validation for critical keys in non-production as well (warning only)
if (!CONFIG.SUPABASE.URL || !CONFIG.SUPABASE.ANON_KEY) {
  console.warn('⚠️ CONFIG WARNING: Supabase credentials are not fully configured. Some features may not work.');
}
