#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

// Read the migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251021210000_restore_conversation_messaging.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('Applying migration to Supabase...');
console.log('Migration file:', migrationPath);

// Parse URL
const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

const postData = JSON.stringify({
  query: migrationSQL
});

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration applied successfully!');
      console.log('Response:', data);
    } else {
      console.error('❌ Failed to apply migration');
      console.error('Status:', res.statusCode);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error applying migration:', error);
  process.exit(1);
});

req.write(postData);
req.end();