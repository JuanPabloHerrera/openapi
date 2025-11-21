# Quick Start Guide

Get up and running with your AI Reseller API in 10 minutes.

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd openapi

# Install dependencies
npm install
```

## Step 2: Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migrations:

```bash
cd supabase
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

## Step 3: Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```bash
# Supabase (from supabase.com project settings)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# OpenRouter (from openrouter.ai)
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Stripe (from stripe.com developers section)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Local development
WORKER_URL=http://localhost:8787
NEXT_PUBLIC_APP_URL=http://localhost:3000
MARKUP_PERCENTAGE=20
```

## Step 4: Start Development Servers

### Terminal 1: Start the Worker

```bash
cd apps/worker
npm install
npm run dev
# Worker running at http://localhost:8787
```

### Terminal 2: Start the Dashboard

```bash
cd apps/dashboard
npm install
npm run dev
# Dashboard running at http://localhost:3000
```

## Step 5: Test the Application

1. Open http://localhost:3000
2. Click "Sign Up" and create an account
3. Go to the dashboard
4. Create an API key
5. (Optional) Add test credits via Stripe

## Step 6: Make Your First API Call

```bash
# Replace YOUR_API_KEY with the key from step 5
curl http://localhost:8787/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Say hello!"}
    ]
  }'
```

## Development Workflow

### Working with the Database

```bash
# Create a new migration
cd supabase
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database (WARNING: deletes all data)
supabase db reset
```

### Testing the Worker

```bash
cd apps/worker

# Run tests
npm test

# Check types
npm run build

# Deploy to Cloudflare
npm run deploy
```

### Testing the Dashboard

```bash
cd apps/dashboard

# Run linter
npm run lint

# Build for production
npm run build

# Deploy to Vercel
vercel
```

## Common Development Tasks

### Add a New Pricing Rule

1. Go to Supabase SQL Editor
2. Run:

```sql
INSERT INTO pricing_rules (model_pattern, markup_percentage, priority)
VALUES ('gpt-4*', 25.00, 10);
```

### Manually Add Credits to a User

```sql
SELECT add_credits('USER_ID', 10.00);
```

### View Recent Usage

```sql
SELECT
  model,
  COUNT(*) as requests,
  SUM(total_tokens) as tokens,
  SUM(credits_deducted) as spent
FROM usage_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY model;
```

## Next Steps

- Read the [API Documentation](./API.md)
- Review the [Deployment Guide](./DEPLOYMENT.md)
- Customize the pricing in Supabase
- Brand the dashboard with your colors/logo
- Set up monitoring and alerts

## Troubleshooting

### "No such module" error in Worker

Make sure you've installed dependencies:

```bash
cd apps/worker
npm install
```

### Authentication not working

Check that:
1. Supabase URL and keys are correct
2. Email confirmation is disabled in Supabase for development
3. Site URL is set correctly in Supabase

### Stripe webhook not receiving events

For local development, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Getting Help

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review [GitHub Issues](your-repo-url/issues)
- Join the Discord community (if you have one)
