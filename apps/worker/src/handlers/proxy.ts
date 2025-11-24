import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env } from '../index';

interface User {
  id: string;
  email: string;
}

interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  usage?: OpenRouterUsage;
  choices: any[];
  [key: string]: any;
}

export async function proxyToOpenRouter(
  c: Context<{ Bindings: Env }>,
  user: User,
  apiKeyId: string
): Promise<Response> {
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get request body
  const requestBody = await c.req.json();
  const model = requestBody.model;

  if (!model) {
    return c.json({
      error: {
        message: 'Model parameter is required',
        type: 'invalid_request_error',
        code: 400,
      }
    }, 400);
  }

  // Estimate cost before making request (optional pre-check)
  const estimatedTokens = estimateTokens(requestBody);
  const estimatedCost = await calculateCost(
    supabase,
    model,
    estimatedTokens.prompt,
    estimatedTokens.completion,
    parseFloat(c.env.MARKUP_PERCENTAGE)
  );

  // Check user balance
  const { data: balance, error: balanceError } = await supabase
    .from('balances')
    .select('credits')
    .eq('user_id', user.id)
    .single();

  if (balanceError || !balance) {
    return c.json({
      error: {
        message: 'Failed to check balance',
        type: 'api_error',
        code: 500,
      }
    }, 500);
  }

  if (balance.credits < estimatedCost) {
    return c.json({
      error: {
        message: `Insufficient credits. Required: $${estimatedCost.toFixed(6)}, Available: $${balance.credits.toFixed(6)}`,
        type: 'insufficient_quota',
        code: 'insufficient_credits',
      }
    }, 402);
  }

  // Forward request to OpenRouter
  const openRouterPath = c.req.path.replace(/^\/v1/, '');
  const openRouterUrl = `https://openrouter.ai/api/v1${openRouterPath}`;

  try {
    // Use configured HTTP referer or worker URL
    const httpReferer = c.env.HTTP_REFERER || c.env.WORKER_URL || 'https://openapi-reseller.com';

    const response = await fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': httpReferer,
        'X-Title': 'AI Reseller API',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);

      // Parse error response if it's JSON
      let errorDetails = errorText;
      let errorMessage = 'OpenRouter request failed';
      let errorType = 'api_error';
      let errorCode = null;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          // OpenRouter/OpenAI error format
          if (typeof errorJson.error === 'string') {
            errorMessage = errorJson.error;
          } else if (errorJson.error.message) {
            errorMessage = errorJson.error.message;
            errorType = errorJson.error.type || errorType;
            errorCode = errorJson.error.code || errorCode;
          }
        }
      } catch (e) {
        // Not JSON, use text as-is
        errorMessage = errorText;
      }

      // Log failed request
      await logUsage(supabase, {
        userId: user.id,
        apiKeyId,
        model,
        status: 'error',
        errorMessage: errorText,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        creditsDeducted: 0,
        requestMetadata: requestBody,
        responseMetadata: { error: errorText },
      });

      // Return OpenAI-compatible error format for n8n compatibility
      return c.json({
        error: {
          message: errorMessage,
          type: errorType,
          code: errorCode || response.status,
        }
      }, response.status >= 400 && response.status < 600 ? response.status as any : 500);
    }

    const responseData: OpenRouterResponse = await response.json();

    // Extract actual usage from response
    const usage = responseData.usage || {
      prompt_tokens: estimatedTokens.prompt,
      completion_tokens: estimatedTokens.completion,
      total_tokens: estimatedTokens.prompt + estimatedTokens.completion,
    };

    // Calculate actual cost
    const actualCost = await calculateCost(
      supabase,
      responseData.model || model,
      usage.prompt_tokens,
      usage.completion_tokens,
      parseFloat(c.env.MARKUP_PERCENTAGE)
    );

    // Deduct credits from user balance
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: actualCost,
      });

    if (deductError || !deductResult) {
      console.error('Failed to deduct credits:', deductError);
      // Still return the response but log the error
    }

    // Log successful request
    await logUsage(supabase, {
      userId: user.id,
      apiKeyId,
      model: responseData.model || model,
      status: 'success',
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      costUsd: actualCost,
      creditsDeducted: actualCost,
      requestMetadata: requestBody,
      responseMetadata: responseData,
    });

    // Return OpenRouter response
    return c.json(responseData);

  } catch (error) {
    console.error('Proxy error:', error);

    // Log error
    await logUsage(supabase, {
      userId: user.id,
      apiKeyId,
      model,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUsd: 0,
      creditsDeducted: 0,
      requestMetadata: requestBody,
      responseMetadata: {},
    });

    return c.json({
      error: {
        message: error instanceof Error ? error.message : 'Failed to proxy request',
        type: 'api_error',
        code: 500,
      }
    }, 500);
  }
}

/**
 * Estimate tokens from request body
 * This is a rough estimate - actual usage comes from OpenRouter response
 */
function estimateTokens(requestBody: any): { prompt: number; completion: number } {
  // Rough estimation: 1 token ≈ 4 characters
  const promptText = JSON.stringify(requestBody.messages || '');
  const promptTokens = Math.ceil(promptText.length / 4);

  const maxTokens = requestBody.max_tokens || 1000;

  return {
    prompt: promptTokens,
    completion: maxTokens,
  };
}

/**
 * Calculate cost based on pricing rules
 */
async function calculateCost(
  supabase: any,
  model: string,
  promptTokens: number,
  completionTokens: number,
  markupPercentage: number
): Promise<number> {
  // Get pricing rules
  const { data: rules, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error || !rules || rules.length === 0) {
    // Fallback to default markup
    return calculateBaseCost(model, promptTokens, completionTokens, markupPercentage);
  }

  // Find matching rule
  let matchedRule = null;
  for (const rule of rules) {
    if (matchesPattern(model, rule.model_pattern)) {
      matchedRule = rule;
      break;
    }
  }

  const markup = matchedRule?.markup_percentage || markupPercentage;
  const baseCost = calculateBaseCost(model, promptTokens, completionTokens, 0);
  const finalCost = baseCost * (1 + markup / 100);

  return Math.max(finalCost, matchedRule?.min_cost_usd || 0.000001);
}

/**
 * Calculate base cost from OpenRouter pricing
 * These are approximate - real costs come from OpenRouter's response
 */
function calculateBaseCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
  markupPercentage: number
): number {
  // Approximate pricing per 1M tokens (update with actual OpenRouter prices)
  const pricing: Record<string, { prompt: number; completion: number }> = {
    'gpt-4-turbo': { prompt: 10, completion: 30 },
    'gpt-4': { prompt: 30, completion: 60 },
    'gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },
    'claude-3-opus': { prompt: 15, completion: 75 },
    'claude-3-sonnet': { prompt: 3, completion: 15 },
    'claude-3-haiku': { prompt: 0.25, completion: 1.25 },
  };

  // Find matching pricing
  let modelPricing = pricing['gpt-3.5-turbo']; // default
  for (const [key, value] of Object.entries(pricing)) {
    if (model.toLowerCase().includes(key.toLowerCase())) {
      modelPricing = value;
      break;
    }
  }

  const promptCost = (promptTokens / 1_000_000) * modelPricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * modelPricing.completion;
  const baseCost = promptCost + completionCost;

  return baseCost * (1 + markupPercentage / 100);
}

/**
 * Check if model matches pattern (supports wildcards)
 */
function matchesPattern(model: string, pattern: string): boolean {
  if (pattern === '*') return true;

  const regex = new RegExp(
    '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
    'i'
  );

  return regex.test(model);
}

/**
 * Log usage to database
 */
async function logUsage(supabase: any, data: {
  userId: string;
  apiKeyId: string;
  model: string;
  status: string;
  errorMessage?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  creditsDeducted: number;
  requestMetadata: any;
  responseMetadata: any;
}): Promise<void> {
  await supabase.from('usage_logs').insert({
    user_id: data.userId,
    api_key_id: data.apiKeyId,
    model: data.model,
    status: data.status,
    error_message: data.errorMessage,
    prompt_tokens: data.promptTokens,
    completion_tokens: data.completionTokens,
    total_tokens: data.totalTokens,
    cost_usd: data.costUsd,
    credits_deducted: data.creditsDeducted,
    request_metadata: data.requestMetadata,
    response_metadata: data.responseMetadata,
  });
}
