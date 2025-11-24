import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env } from '../index';
import { createHash } from './utils';

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  apiKeyId?: string;
  error?: string;
}

export async function authenticateRequest(c: Context<{ Bindings: Env }>): Promise<AuthResult> {
  // Get API key from Authorization header
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return { success: false, error: 'Missing Authorization header' };
  }

  // Extract API key (supports "Bearer sk_xxx" or just "sk_xxx")
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Validate API key format: sk_live_{64 hex characters} = 72 chars total
  if (!apiKey || !apiKey.startsWith('sk_')) {
    return { success: false, error: 'Invalid API key format' };
  }

  if (apiKey.length !== 72) {
    return { success: false, error: 'Invalid API key length' };
  }

  // Validate it's a proper hex string after the prefix
  const keyParts = apiKey.match(/^sk_live_([0-9a-f]{64})$/);
  if (!keyParts) {
    return { success: false, error: 'Invalid API key format' };
  }

  // Hash the API key for lookup
  const keyHash = await createHash(apiKey);

  // Initialize Supabase client
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Look up API key
  const { data: apiKeyData, error: keyError } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active, expires_at')
    .eq('key_hash', keyHash)
    .single();

  if (keyError || !apiKeyData) {
    return { success: false, error: 'Invalid API key' };
  }

  // Check if key is active
  if (!apiKeyData.is_active) {
    return { success: false, error: 'API key is inactive' };
  }

  // Check if key is expired
  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
    return { success: false, error: 'API key has expired' };
  }

  // Get user info
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', apiKeyData.user_id)
    .single();

  if (userError || !userData) {
    return { success: false, error: 'User not found' };
  }

  // Type assertion for userData
  const user = userData as { id: string; email: string };

  // Update last_used_at
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyData.id)
    .then(); // Fire and forget

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
    },
    apiKeyId: apiKeyData.id,
  };
}
