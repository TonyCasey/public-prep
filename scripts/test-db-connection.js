// Test database connection using the same method as the application
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from '../shared/schema.js';

neonConfig.webSocketConstructor = ws;

// Get environment
const nodeEnv = process.env.NODE_ENV;
console.log('Environment:', nodeEnv);

// Get database URL using the same logic as db.ts
function getDatabaseUrl() {
  console.log('📋 Environment variables check:');
  console.log('   NODE_ENV:', nodeEnv);
  console.log('   DATABASE_URL_DEV exists:', process.env.DATABASE_URL_DEV ? 'YES' : 'NO');
  console.log('   DATABASE_URL exists:', process.env.DATABASE_URL ? 'YES' : 'NO');
  
  if (nodeEnv === 'development') {
    const devUrl = process.env.DATABASE_URL_DEV;
    if (devUrl) {
      console.log('🔧 Using development database:', devUrl.substring(0, 50) + '...');
      return devUrl;
    } else {
      console.log('⚠️  DATABASE_URL_DEV not found, falling back to DATABASE_URL');
    }
  }
  
  const prodUrl = process.env.DATABASE_URL;
  console.log('🔧 Using production database:', prodUrl.substring(0, 50) + '...');
  return prodUrl;
}

const databaseUrl = getDatabaseUrl();
if (!databaseUrl) {
  console.error('❌ No database URL found');
  process.exit(1);
}

// Create connection using exact same method as application
const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle({ client: pool, schema });

// Test connection
async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic query using pool
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Basic query successful:', result.rows);
    
    // Test table listing using pool
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('📋 Available tables:', tables.rows.map(row => row.table_name));
    
    // Test users table specifically using pool
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Users table count:', userCount.rows[0].count);
    
    // Test Drizzle ORM query (this is what's failing)
    console.log('🔍 Testing Drizzle ORM query...');
    const { users } = schema;
    const allUsers = await db.select().from(users).limit(5);
    console.log('👥 Drizzle users query result:', allUsers.length, 'users found');
    
    console.log('✅ All database tests passed!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testConnection();