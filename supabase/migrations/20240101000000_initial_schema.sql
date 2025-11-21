-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    company TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    key_hash TEXT UNIQUE NOT NULL,
    key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "sk_live_")
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Index for fast key lookups
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);

-- Balances table
CREATE TABLE public.balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    credits DECIMAL(12, 6) DEFAULT 0 CHECK (credits >= 0),
    currency TEXT DEFAULT 'USD',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    stripe_price_id TEXT UNIQUE,
    price_cents INTEGER NOT NULL,
    included_credits DECIMAL(12, 6) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id),
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status TEXT NOT NULL, -- active, canceled, past_due, etc.
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

-- Payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    amount_cents INTEGER NOT NULL,
    credits_added DECIMAL(12, 6) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL, -- succeeded, pending, failed
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_stripe_id ON public.payments(stripe_payment_intent_id);

-- Usage logs table
CREATE TABLE public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    provider TEXT DEFAULT 'openrouter',
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(12, 6) NOT NULL,
    credits_deducted DECIMAL(12, 6) NOT NULL,
    request_metadata JSONB DEFAULT '{}'::jsonb,
    response_metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL, -- success, error, rate_limited
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_model ON public.usage_logs(model);
CREATE INDEX idx_usage_logs_user_created ON public.usage_logs(user_id, created_at DESC);

-- Rate limits table
CREATE TABLE public.rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    requests_per_minute INTEGER DEFAULT 60,
    requests_per_hour INTEGER DEFAULT 1000,
    requests_per_day INTEGER DEFAULT 10000,
    max_tokens_per_request INTEGER DEFAULT 4096,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing rules table
CREATE TABLE public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_pattern TEXT NOT NULL, -- e.g., "gpt-4", "claude-*", "*"
    markup_percentage DECIMAL(5, 2) DEFAULT 20.00,
    min_cost_usd DECIMAL(12, 6) DEFAULT 0.000001,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority rules matched first
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pricing_rules_pattern ON public.pricing_rules(model_pattern);

-- Insert default pricing rule
INSERT INTO public.pricing_rules (model_pattern, markup_percentage, priority)
VALUES ('*', 20.00, 0);

-- Request counter for rate limiting (uses short TTL)
CREATE TABLE public.request_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    window_type TEXT NOT NULL, -- minute, hour, day
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    request_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, window_type, window_start)
);

CREATE INDEX idx_request_counters_lookup ON public.request_counters(user_id, window_type, window_start);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON public.balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON public.rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON public.pricing_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_counters ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- API Keys policies
CREATE POLICY "Users can view own api keys" ON public.api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own api keys" ON public.api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys" ON public.api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys" ON public.api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Balances policies
CREATE POLICY "Users can view own balance" ON public.balances
    FOR SELECT USING (auth.uid() = user_id);

-- Plans are publicly readable
CREATE POLICY "Anyone can view active plans" ON public.plans
    FOR SELECT USING (is_active = true);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Rate limits policies
CREATE POLICY "Users can view own rate limits" ON public.rate_limits
    FOR SELECT USING (auth.uid() = user_id);

-- Pricing rules are publicly readable
CREATE POLICY "Anyone can view active pricing rules" ON public.pricing_rules
    FOR SELECT USING (is_active = true);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

    INSERT INTO public.balances (user_id, credits)
    VALUES (NEW.id, 0);

    INSERT INTO public.rate_limits (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to deduct credits (used by Worker)
CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id UUID,
    p_amount DECIMAL(12, 6)
)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits DECIMAL(12, 6);
BEGIN
    -- Get current balance with row lock
    SELECT credits INTO current_credits
    FROM public.balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Check if sufficient balance
    IF current_credits < p_amount THEN
        RETURN FALSE;
    END IF;

    -- Deduct credits
    UPDATE public.balances
    SET credits = credits - p_amount
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(
    p_user_id UUID,
    p_amount DECIMAL(12, 6)
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.balances
    SET credits = credits + p_amount
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for user dashboard stats
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
    u.id as user_id,
    b.credits,
    COUNT(DISTINCT ul.id) as total_requests,
    COALESCE(SUM(ul.total_tokens), 0) as total_tokens_used,
    COALESCE(SUM(ul.credits_deducted), 0) as total_credits_spent,
    COUNT(DISTINCT ak.id) as active_api_keys
FROM public.users u
LEFT JOIN public.balances b ON u.id = b.user_id
LEFT JOIN public.usage_logs ul ON u.id = ul.user_id
LEFT JOIN public.api_keys ak ON u.id = ak.user_id AND ak.is_active = true
GROUP BY u.id, b.credits;

-- Grant access to authenticated users
GRANT SELECT ON public.user_stats TO authenticated;
