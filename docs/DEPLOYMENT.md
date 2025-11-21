# Deployment Guide

This guide will walk you through deploying your AI Reseller SaaS platform to production.

## Prerequisites

- Node.js 18+ installed
- Cloudflare account
- Supabase account
- Stripe account
- OpenRouter API key
- Domain name (optional but recommended)

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and keys:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJh...` (public)
   - Service Role Key: `eyJh...` (secret)

### 1.2 Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
cd supabase
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

### 1.3 Configure Authentication

1. Go to Authentication > Settings in Supabase dashboard
2. Enable Email/Password authentication
3. Configure email templates if needed
4. Set Site URL to your production domain

## Part 2: Stripe Setup

### 2.1 Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your API keys from the Developers section:
   - Publishable Key: `pk_test_...` (or `pk_live_...` for production)
   - Secret Key: `sk_test_...` (or `sk_live_...` for production)

### 2.2 Configure Webhook

1. Go to Developers > Webhooks in Stripe dashboard
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret: `whsec_...`

## Part 3: OpenRouter Setup

### 3.1 Get API Key

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up and create an API key
3. Note your API key: `sk-or-v1-...`
4. Add credits to your OpenRouter account

## Part 4: Cloudflare Worker Deployment

### 4.1 Install Wrangler

```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### 4.2 Configure Secrets

```bash
cd apps/worker

# Set secrets
wrangler secret put SUPABASE_URL
# Enter: https://xxxxx.supabase.co

wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Enter: your service role key

wrangler secret put OPENROUTER_API_KEY
# Enter: sk-or-v1-...
```

### 4.3 Deploy Worker

```bash
# Build and deploy
wrangler deploy

# Note the deployed URL: https://ai-reseller-worker.YOUR_SUBDOMAIN.workers.dev
```

### 4.4 Custom Domain (Optional)

1. Go to Cloudflare Workers dashboard
2. Navigate to your worker
3. Click "Triggers" tab
4. Add a custom domain (e.g., `api.yourdomain.com`)

## Part 5: Dashboard Deployment (Vercel)

### 5.1 Prepare Environment Variables

Create `.env.local` in `apps/dashboard`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Cloudflare Worker
WORKER_URL=https://your-worker.workers.dev

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
MARKUP_PERCENTAGE=20
```

### 5.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/dashboard
vercel

# Follow prompts and add environment variables
```

Or use the Vercel dashboard:

1. Connect your GitHub repository
2. Select the `apps/dashboard` directory as the root
3. Add all environment variables
4. Deploy

### 5.3 Update Supabase Auth Settings

1. Go to Supabase dashboard > Authentication > URL Configuration
2. Add your production URL to "Site URL"
3. Add redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/dashboard`

## Part 6: Verification

### 6.1 Test Worker

```bash
curl https://your-worker.workers.dev/health
# Should return: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

### 6.2 Test Dashboard

1. Visit your dashboard URL
2. Sign up for a new account
3. Check that user profile is created in Supabase
4. Generate an API key
5. Purchase credits (use Stripe test mode)

### 6.3 Test API

```bash
curl https://your-worker.workers.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Part 7: Production Checklist

- [ ] Switch Stripe to live mode keys
- [ ] Update MARKUP_PERCENTAGE to your desired rate
- [ ] Configure custom domains
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Enable Cloudflare Analytics
- [ ] Set up email alerts for low OpenRouter balance
- [ ] Create backup procedures for Supabase
- [ ] Configure rate limits appropriately
- [ ] Test webhook endpoints
- [ ] Add legal pages (Terms, Privacy)
- [ ] Set up customer support

## Monitoring & Maintenance

### Logs

- **Cloudflare Worker**: View logs in Cloudflare dashboard
- **Supabase**: Check logs in Supabase dashboard
- **Vercel**: View deployment logs in Vercel dashboard

### Database Maintenance

```bash
# Clean old request counters (run weekly)
supabase db execute "SELECT public.cleanup_old_request_counters();"
```

### Cost Optimization

1. Monitor OpenRouter usage vs. revenue
2. Adjust markup percentage if needed
3. Review rate limits to prevent abuse
4. Check for unused API keys

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Security Notes

- Never commit `.env` files
- Use environment variables for all secrets
- Rotate API keys regularly
- Monitor for suspicious activity
- Keep dependencies updated
- Enable Cloudflare security features
