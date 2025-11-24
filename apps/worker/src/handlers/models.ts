import { Context } from 'hono';
import { Env } from '../index';

// Cache models for 1 hour to reduce API calls to OpenRouter
let cachedModels: any = null;
let cacheExpiry: number = 0;

/**
 * Returns a list of available models
 * This is required for OpenAI-compatible clients like n8n to fetch model list
 * Fetches models dynamically from OpenRouter to always show latest models
 */
export async function listModels(c: Context<{ Bindings: Env }>) {
  // Check if we have cached models that are still valid
  const now = Date.now();
  if (cachedModels && now < cacheExpiry) {
    return c.json({
      object: 'list',
      data: cachedModels,
    });
  }

  try {
    // Fetch models from OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${c.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch models from OpenRouter:', response.status);
      return getFallbackModels(c);
    }

    const openRouterData = await response.json() as { data: any[] };

    // Transform OpenRouter format to OpenAI format for compatibility
    const models = openRouterData.data.map((model: any) => ({
      id: model.id,
      object: 'model',
      created: model.created || Math.floor(Date.now() / 1000),
      owned_by: model.id.split('/')[0], // Extract provider from model ID
      permission: [],
      root: model.id,
      parent: null,
      // Include additional useful metadata
      description: model.description,
      context_length: model.context_length,
      pricing: model.pricing,
    }));

    // Cache for 1 hour
    cachedModels = models;
    cacheExpiry = now + (60 * 60 * 1000);

    return c.json({
      object: 'list',
      data: models,
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return getFallbackModels(c);
  }
}

/**
 * Fallback models list in case OpenRouter API is unavailable
 * These are popular, stable models that should always work
 */
function getFallbackModels(c: Context<{ Bindings: Env }>) {
  const fallbackModels = [
    // Free models
    { id: 'meta-llama/llama-3.2-3b-instruct:free', object: 'model', created: 1677610602, owned_by: 'meta-llama', permission: [], root: 'meta-llama/llama-3.2-3b-instruct:free', parent: null },
    { id: 'google/gemini-flash-1.5', object: 'model', created: 1677610602, owned_by: 'google', permission: [], root: 'google/gemini-flash-1.5', parent: null },
    // Latest models
    { id: 'anthropic/claude-opus-4.5', object: 'model', created: 1732320000, owned_by: 'anthropic', permission: [], root: 'anthropic/claude-opus-4.5', parent: null },
    { id: 'anthropic/claude-3.5-sonnet', object: 'model', created: 1677610602, owned_by: 'anthropic', permission: [], root: 'anthropic/claude-3.5-sonnet', parent: null },
    { id: 'anthropic/claude-3-haiku', object: 'model', created: 1677610602, owned_by: 'anthropic', permission: [], root: 'anthropic/claude-3-haiku', parent: null },
    // OpenAI models
    { id: 'openai/gpt-4o', object: 'model', created: 1677610602, owned_by: 'openai', permission: [], root: 'openai/gpt-4o', parent: null },
    { id: 'openai/gpt-4o-mini', object: 'model', created: 1677610602, owned_by: 'openai', permission: [], root: 'openai/gpt-4o-mini', parent: null },
    { id: 'openai/gpt-4-turbo', object: 'model', created: 1677610602, owned_by: 'openai', permission: [], root: 'openai/gpt-4-turbo', parent: null },
    // Meta models
    { id: 'meta-llama/llama-3.3-70b-instruct', object: 'model', created: 1677610602, owned_by: 'meta-llama', permission: [], root: 'meta-llama/llama-3.3-70b-instruct', parent: null },
    { id: 'meta-llama/llama-3.1-405b-instruct', object: 'model', created: 1677610602, owned_by: 'meta-llama', permission: [], root: 'meta-llama/llama-3.1-405b-instruct', parent: null },
    // Google models
    { id: 'google/gemini-pro-1.5', object: 'model', created: 1677610602, owned_by: 'google', permission: [], root: 'google/gemini-pro-1.5', parent: null },
    { id: 'google/gemini-2.0-flash-exp:free', object: 'model', created: 1677610602, owned_by: 'google', permission: [], root: 'google/gemini-2.0-flash-exp:free', parent: null },
    // Mistral models
    { id: 'mistralai/mistral-large', object: 'model', created: 1677610602, owned_by: 'mistralai', permission: [], root: 'mistralai/mistral-large', parent: null },
    // DeepSeek
    { id: 'deepseek/deepseek-chat', object: 'model', created: 1677610602, owned_by: 'deepseek', permission: [], root: 'deepseek/deepseek-chat', parent: null },
  ];

  return c.json({
    object: 'list',
    data: fallbackModels,
  });
}
