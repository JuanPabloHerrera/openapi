import { Context } from 'hono';
import { Env } from '../index';

/**
 * Returns a list of available models
 * This is required for OpenAI-compatible clients like n8n to fetch model list
 */
export async function listModels(c: Context<{ Bindings: Env }>) {
  // Popular OpenRouter models
  const models = [
    // Free models
    {
      id: 'meta-llama/llama-3.2-3b-instruct:free',
      object: 'model',
      created: 1677610602,
      owned_by: 'meta-llama',
      permission: [],
      root: 'meta-llama/llama-3.2-3b-instruct:free',
      parent: null,
    },
    {
      id: 'google/gemini-flash-1.5',
      object: 'model',
      created: 1677610602,
      owned_by: 'google',
      permission: [],
      root: 'google/gemini-flash-1.5',
      parent: null,
    },
    {
      id: 'anthropic/claude-3-haiku',
      object: 'model',
      created: 1677610602,
      owned_by: 'anthropic',
      permission: [],
      root: 'anthropic/claude-3-haiku',
      parent: null,
    },
    // OpenAI models
    {
      id: 'openai/gpt-4o-mini',
      object: 'model',
      created: 1677610602,
      owned_by: 'openai',
      permission: [],
      root: 'openai/gpt-4o-mini',
      parent: null,
    },
    {
      id: 'openai/gpt-4o',
      object: 'model',
      created: 1677610602,
      owned_by: 'openai',
      permission: [],
      root: 'openai/gpt-4o',
      parent: null,
    },
    {
      id: 'openai/gpt-4-turbo',
      object: 'model',
      created: 1677610602,
      owned_by: 'openai',
      permission: [],
      root: 'openai/gpt-4-turbo',
      parent: null,
    },
    // Anthropic models
    {
      id: 'anthropic/claude-3.5-sonnet',
      object: 'model',
      created: 1677610602,
      owned_by: 'anthropic',
      permission: [],
      root: 'anthropic/claude-3.5-sonnet',
      parent: null,
    },
    {
      id: 'anthropic/claude-3-opus',
      object: 'model',
      created: 1677610602,
      owned_by: 'anthropic',
      permission: [],
      root: 'anthropic/claude-3-opus',
      parent: null,
    },
    // Meta models
    {
      id: 'meta-llama/llama-3.1-70b-instruct',
      object: 'model',
      created: 1677610602,
      owned_by: 'meta-llama',
      permission: [],
      root: 'meta-llama/llama-3.1-70b-instruct',
      parent: null,
    },
    {
      id: 'meta-llama/llama-3.1-405b-instruct',
      object: 'model',
      created: 1677610602,
      owned_by: 'meta-llama',
      permission: [],
      root: 'meta-llama/llama-3.1-405b-instruct',
      parent: null,
    },
    // Google models
    {
      id: 'google/gemini-pro-1.5',
      object: 'model',
      created: 1677610602,
      owned_by: 'google',
      permission: [],
      root: 'google/gemini-pro-1.5',
      parent: null,
    },
    // Mistral models
    {
      id: 'mistralai/mistral-large',
      object: 'model',
      created: 1677610602,
      owned_by: 'mistralai',
      permission: [],
      root: 'mistralai/mistral-large',
      parent: null,
    },
    {
      id: 'mistralai/mixtral-8x7b-instruct',
      object: 'model',
      created: 1677610602,
      owned_by: 'mistralai',
      permission: [],
      root: 'mistralai/mixtral-8x7b-instruct',
      parent: null,
    },
  ];

  return c.json({
    object: 'list',
    data: models,
  });
}
