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
  WORKER_URL?: string; // Public URL of this worker
  DASHBOARD_URL?: string; // Public URL of the dashboard
  HTTP_REFERER?: string; // HTTP referer for OpenRouter requests
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware - restrict to specific origins
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');

  // Default allowed origins for local development
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8787'];

  // Get additional allowed origins from environment (if set)
  const allowedOriginsEnv = c.env.ALLOWED_ORIGINS || '';
  const envOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map((o: string) => o.trim()).filter(Boolean)
    : [];

  const allowedOrigins = [...defaultOrigins, ...envOrigins];

  // Check if origin is allowed
  const isAllowed = origin ? allowedOrigins.includes(origin) : false;

  // For requests without origin (e.g., server-to-server), allow but don't set CORS headers
  // For requests with origin, only allow if in whitelist
  const allowedOrigin = isAllowed && origin ? origin : defaultOrigins[0];

  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    });
  }

  await next();

  // Add CORS headers to response (only if origin is allowed or no origin present)
  if (!origin || isAllowed) {
    c.res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    c.res.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Add security headers to all responses
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');

  // Add HSTS header if using HTTPS
  const url = new URL(c.req.url);
  if (url.protocol === 'https:') {
    c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
});

// Root endpoint - homepage
app.get('/', (c) => {
  const workerUrl = c.env.WORKER_URL || 'http://localhost:8787';
  const dashboardUrl = c.env.DASHBOARD_URL || 'http://localhost:3000';
  const markup = c.env.MARKUP_PERCENTAGE || '20';

  return c.json({
    name: 'OpenAPI Reseller Worker',
    version: '1.0.0',
    status: 'running',
    markup: `${markup}%`,
    endpoints: {
      health: '/health',
      models: '/v1/models',
      chat: '/v1/chat/completions',
    },
    docs: 'Use this API with n8n or any OpenAI-compatible client',
    setup: {
      base_url: `${workerUrl}/v1`,
      api_key: `Get from dashboard at ${dashboardUrl}/dashboard/keys`,
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
