import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env } from '../index';

export interface RateLimitResult {
  success: boolean;
  error?: string;
}

export async function checkRateLimit(
  c: Context<{ Bindings: Env }>,
  userId: string
): Promise<RateLimitResult> {
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get user's rate limits
  const { data: limits, error: limitsError } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (limitsError || !limits) {
    // Default limits if not found
    return { success: true };
  }

  const now = new Date();

  // Check minute window
  const minuteWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
    now.getHours(), now.getMinutes(), 0);

  const minuteCount = await getRequestCount(supabase, userId, 'minute', minuteWindow);
  if (minuteCount >= limits.requests_per_minute) {
    return {
      success: false,
      error: `Rate limit exceeded: ${limits.requests_per_minute} requests per minute`
    };
  }

  // Check hour window
  const hourWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
    now.getHours(), 0, 0);

  const hourCount = await getRequestCount(supabase, userId, 'hour', hourWindow);
  if (hourCount >= limits.requests_per_hour) {
    return {
      success: false,
      error: `Rate limit exceeded: ${limits.requests_per_hour} requests per hour`
    };
  }

  // Check day window
  const dayWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const dayCount = await getRequestCount(supabase, userId, 'day', dayWindow);
  if (dayCount >= limits.requests_per_day) {
    return {
      success: false,
      error: `Rate limit exceeded: ${limits.requests_per_day} requests per day`
    };
  }

  // Increment counters
  await incrementRequestCount(supabase, userId, 'minute', minuteWindow);
  await incrementRequestCount(supabase, userId, 'hour', hourWindow);
  await incrementRequestCount(supabase, userId, 'day', dayWindow);

  return { success: true };
}

async function getRequestCount(
  supabase: any,
  userId: string,
  windowType: string,
  windowStart: Date
): Promise<number> {
  const { data, error } = await supabase
    .from('request_counters')
    .select('request_count')
    .eq('user_id', userId)
    .eq('window_type', windowType)
    .eq('window_start', windowStart.toISOString())
    .single();

  if (error || !data) {
    return 0;
  }

  return data.request_count;
}

async function incrementRequestCount(
  supabase: any,
  userId: string,
  windowType: string,
  windowStart: Date
): Promise<void> {
  await supabase.rpc('increment_request_counter', {
    p_user_id: userId,
    p_window_type: windowType,
    p_window_start: windowStart.toISOString(),
  });
}
