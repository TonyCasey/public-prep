import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Select database based on environment
function getDatabaseUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    const prodUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
    if (!prodUrl) {
      throw new Error('Production DATABASE_URL_PROD or DATABASE_URL must be configured for production environment');
    }
    console.log('🔄 Using production database:', prodUrl.substring(0, 50) + '...');
    return prodUrl;
  } else {
    // Development: Use DATABASE_URL (standard) or fallback to DATABASE_URL_DEV for backwards compatibility
    const devUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_DEV;
    if (!devUrl) {
      throw new Error('DATABASE_URL must be configured for development environment');
    }
    console.log('🔧 Using development database:', devUrl.substring(0, 50) + '...');
    return devUrl;
  }
}

// Use our environment-specific database URLs, never Replit's automatic DATABASE_URL
let databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  throw new Error(
    "Database URL must be set. Did you forget to provision a database?",
  );
}

// Debug database connection
console.log('🔍 Final Database URL check:');
console.log(`   Environment: ${process.env.NODE_ENV}`);
console.log(`   Using: ${databaseUrl.includes('super-glade') ? 'DEVELOPMENT' : 'PRODUCTION'} database`);
console.log(`   URL fragment: ...${databaseUrl.substring(databaseUrl.length - 30)}`);

// For production, use connection object to handle special characters and IPv6 issues
let poolConfig;
if (process.env.NODE_ENV === 'production') {
  try {
    // Parse URL manually to handle special characters in password
    const url = new URL(databaseUrl);
    
    if (databaseUrl.includes('ep-super-glade-a9u5f42c-pooler.gwc.azure.neon.tech')) {
      console.log('🔧 Using connection object with IPv4 for Neon database');
      poolConfig = {
        host: '72.144.105.10', // Use IPv4 directly for Neon
        port: parseInt(url.port) || 5432,
        database: url.pathname.replace('/', ''),
        user: url.username,
        password: decodeURIComponent(url.password),
        ssl: { rejectUnauthorized: false },
        // Neon requires endpoint ID for SNI when using direct IP
        options: 'endpoint=ep-super-glade-a9u5f42c',
        // Additional connection options for better stability
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };
    } else {
      // For Supabase or other databases with special characters
      console.log('🔧 Using connection object to handle special characters');
      poolConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.replace('/', ''),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        ssl: { rejectUnauthorized: false },
        // Additional connection options for better stability
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };
    }
  } catch (e) {
    console.error('Failed to parse DATABASE_URL:', e);
    // Fallback to direct connection string
    poolConfig = { 
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }
} else {
  // Development: use connection string directly
  poolConfig = { 
    connectionString: databaseUrl,
    // Additional connection options for better stability
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });