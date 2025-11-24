#!/usr/bin/env node
/**
 * Helper script to load environment variables from root .env.local
 * and create a .dev.vars file for wrangler
 */

const fs = require('fs');
const path = require('path');

// Path to root .env.local
const envPath = path.join(__dirname, '../../.env.local');

// Variables that the worker needs
const workerVars = [
  'NEXT_PUBLIC_SUPABASE_URL',  // Worker uses this as SUPABASE_URL
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENROUTER_API_KEY',
  'MARKUP_PERCENTAGE',
  'ALLOWED_ORIGINS'
];

try {
  // Read .env.local
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Parse environment variables
  const env = {};
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim() === '' || line.trim().startsWith('#')) return;

    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  // Create .dev.vars content with only worker-needed vars
  let devVarsContent = '# Auto-generated from ../../.env.local\n';
  devVarsContent += '# DO NOT EDIT - This file is auto-generated\n\n';

  // Map NEXT_PUBLIC_SUPABASE_URL to SUPABASE_URL for worker
  if (env['NEXT_PUBLIC_SUPABASE_URL']) {
    devVarsContent += `SUPABASE_URL=${env['NEXT_PUBLIC_SUPABASE_URL']}\n`;
  }

  // Add other worker vars
  workerVars.forEach(varName => {
    if (varName === 'NEXT_PUBLIC_SUPABASE_URL') return; // Already handled above
    if (env[varName]) {
      devVarsContent += `${varName}=${env[varName]}\n`;
    }
  });

  // Write .dev.vars
  const devVarsPath = path.join(__dirname, '.dev.vars');
  fs.writeFileSync(devVarsPath, devVarsContent);

  console.log('✅ Generated .dev.vars from .env.local');
} catch (error) {
  console.error('❌ Error generating .dev.vars:', error.message);
  process.exit(1);
}
