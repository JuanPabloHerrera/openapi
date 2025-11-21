import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from './middleware/auth';
import { checkRateLimit } from './middleware/rateLimit';
import { proxyToOpenRouter } from './handlers/proxy';
import { healthCheck } from './handlers/health';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
  MARKUP_PERCENTAGE: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint
app.get('/health', healthCheck);

// Main proxy endpoint - supports both /v1/chat/completions and direct OpenRouter paths
app.post('/v1/*', async (c) => {
  try {
    // Authenticate and get user
    const authResult = await authenticateRequest(c);
    if (!authResult.success) {
      return c.json({ error: authResult.error }, 401);
    }

    if (!authResult.user || !authResult.apiKeyId) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const { user, apiKeyId } = authResult;

    // Check rate limits
    const rateLimitResult = await checkRateLimit(c, user.id);
    if (!rateLimitResult.success) {
      return c.json({ error: rateLimitResult.error }, 429);
    }

    // Proxy request to OpenRouter
    return await proxyToOpenRouter(c, user, apiKeyId);

  } catch (error) {
    console.error('Request error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Catch-all for unsupported paths
app.all('*', (c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
