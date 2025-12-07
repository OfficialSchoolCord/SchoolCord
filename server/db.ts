
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Use connection pooler for better performance
    const poolUrl = databaseUrl.replace('.us-east-2', '-pooler.us-east-2');
    
    pool = new Pool({
      connectionString: poolUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  return pool;
}

export async function initializeDatabase() {
  const pool = getDbPool();
  
  try {
    // Test the connection
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
    
    // Run migrations
    await runMigrations();
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

async function runMigrations() {
  const pool = getDbPool();
  const fs = await import('fs');
  const path = await import('path');
  
  const migrationsDir = path.join(process.cwd(), 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found, skipping migrations');
    return;
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    
    try {
      await pool.query(sql);
      console.log(`Migration ${file} completed successfully`);
    } catch (error) {
      console.error(`Migration ${file} failed:`, error);
      throw error;
    }
  }
}

export async function query(text: string, params?: any[]) {
  const pool = getDbPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
