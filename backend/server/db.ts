import { Pool } from 'pg';
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
const databaseUrl = getDatabaseUrl();

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

export const pool = new Pool({ 
  connectionString: databaseUrl,
  // Force IPv4 to avoid Heroku IPv6 connectivity issues
  family: 4,
  // Additional connection options for better stability
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
export const db = drizzle(pool, { schema });