// Shared types and utilities

export interface User {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  expires_at?: string;
}

export interface Balance {
  id: string;
  user_id: string;
  credits: number;
  currency: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  api_key_id?: string;
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  credits_deducted: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface RateLimit {
  id: string;
  user_id: string;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  max_tokens_per_request: number;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  model_pattern: string;
  markup_percentage: number;
  min_cost_usd: number;
  is_active: boolean;
  priority: number;
}

// Utility functions
export function formatCredits(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatTokens(tokens: number): string {
  return tokens.toLocaleString();
}

export function calculateEstimatedCost(
  promptTokens: number,
  completionTokens: number,
  pricePerMillionPrompt: number,
  pricePerMillionCompletion: number,
  markupPercentage: number = 20
): number {
  const promptCost = (promptTokens / 1_000_000) * pricePerMillionPrompt;
  const completionCost = (completionTokens / 1_000_000) * pricePerMillionCompletion;
  const baseCost = promptCost + completionCost;
  return baseCost * (1 + markupPercentage / 100);
}
