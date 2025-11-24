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
  ALLOWED_ORIGINS?: string; // Comma-separated list of allowed origins
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware - restrict to specific origins
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');

  // Default allowed origins for local development
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001'];

  // Get additional allowed origins from environment (if set)
  const allowedOriginsEnv = c.env.ALLOWED_ORIGINS || '';
  const envOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map((o: string) => o.trim())
    : [];

  const allowedOrigins = [...defaultOrigins, ...envOrigins];

  // Check if origin is allowed
  const isAllowed = !origin || allowedOrigins.includes(origin);

  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': isAllowed && origin ? origin : defaultOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  await next();

  // Add CORS headers to response
  c.res.headers.set('Access-Control-Allow-Origin', isAllowed && origin ? origin : '*');
  c.res.headers.set('Access-Control-Allow-Credentials', 'true');
});

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

    // Type assertions after validation
    const user = authResult.user!;
    const apiKeyId = authResult.apiKeyId!;

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
