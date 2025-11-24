import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from './middleware/auth';
import { checkRateLimit } from './middleware/rateLimit';
import { proxyToOpenRouter } from './handlers/proxy';
import { healthCheck } from './handlers/health';
import { listModels } from './handlers/models';

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

// Root endpoint - homepage
app.get('/', (c) => {
  return c.json({
    name: 'OpenAPI Reseller Worker',
    version: '1.0.0',
    status: 'running',
    markup: '5%',
    endpoints: {
      health: '/health',
      models: '/v1/models',
      chat: '/v1/chat/completions',
    },
    docs: 'Use this API with n8n or any OpenAI-compatible client',
    n8n_setup: {
      base_url: 'http://localhost:8787/v1',
      api_key: 'Get from dashboard at http://localhost:3000/dashboard/keys',
    },
  });
});

// Health check endpoint
app.get('/health', healthCheck);

// List available models - required for OpenAI-compatible clients like n8n
app.get('/v1/models', listModels);

// Main proxy endpoint - supports both /v1/chat/completions and direct OpenRouter paths
app.post('/v1/*', async (c) => {
  try {
    // Authenticate and get user
    const authResult = await authenticateRequest(c);
    if (!authResult.success) {
      return c.json({
        error: {
          message: authResult.error || 'Authentication failed',
          type: 'invalid_request_error',
          code: 'invalid_api_key',
        }
      }, 401);
    }

    if (!authResult.user || !authResult.apiKeyId) {
      return c.json({
        error: {
          message: 'Authentication failed',
          type: 'invalid_request_error',
          code: 'invalid_api_key',
        }
      }, 401);
    }

    // Type assertions after validation
    const user = authResult.user!;
    const apiKeyId = authResult.apiKeyId!;

    // Check rate limits
    const rateLimitResult = await checkRateLimit(c, user.id);
    if (!rateLimitResult.success) {
      return c.json({
        error: {
          message: rateLimitResult.error || 'Rate limit exceeded',
          type: 'rate_limit_error',
          code: 'rate_limit_exceeded',
        }
      }, 429);
    }

    // Proxy request to OpenRouter
    return await proxyToOpenRouter(c, user, apiKeyId);

  } catch (error) {
    console.error('Request error:', error);
    return c.json({
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        type: 'api_error',
        code: 500,
      }
    }, 500);
  }
});

// Catch-all for unsupported paths
app.all('*', (c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
