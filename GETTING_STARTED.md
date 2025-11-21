# Getting Started

Welcome to your AI Reseller SaaS platform! This guide will help you get started quickly.

## 🎯 What You Built

You now have a complete, production-ready AI model reseller platform that includes:

- ✅ **Cloudflare Worker** - Global API gateway that proxies requests to OpenRouter
- ✅ **Supabase Database** - User management, API keys, usage tracking, and billing
- ✅ **Stripe Integration** - Credit purchases and payment processing
- ✅ **Next.js Dashboard** - Beautiful UI for users to manage their accounts
- ✅ **Complete Documentation** - Deployment guides, API docs, and troubleshooting

## 🚀 Quick Start (5 minutes)

### Option 1: Automated Setup

```bash
./scripts/setup.sh
```

This will:
- Install all dependencies
- Create .env.local file
- Set up Supabase (if you want)
- Guide you through the setup

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Update .env.local with your keys

# 4. Run Supabase migrations
cd supabase
supabase link --project-ref YOUR_PROJECT_ID
supabase db push

# 5. Start development servers

# Terminal 1: Worker
cd apps/worker
npm run dev

# Terminal 2: Dashboard
cd apps/dashboard
npm run dev
```

## 📋 Prerequisites

You'll need accounts and API keys from:

1. **Supabase** (supabase.com) - Free tier available
   - Project URL
   - Anon key
   - Service role key

2. **OpenRouter** (openrouter.ai) - Pay as you go
   - API key
   - Add some credits to your account

3. **Stripe** (stripe.com) - Free for testing
   - Publishable key
   - Secret key
   - Webhook secret

4. **Cloudflare** (cloudflare.com) - Free tier includes 100k requests/day
   - Account for deploying Worker

## 📚 Documentation

- **[Quick Start Guide](./docs/QUICK_START.md)** - Detailed setup instructions
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deploy to production
- **[API Documentation](./docs/API.md)** - API reference and examples
- **[Architecture](./docs/ARCHITECTURE.md)** - System design and technical details
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🏗️ Project Structure

```
.
├── apps/
│   ├── worker/              # Cloudflare Worker (API Gateway)
│   │   ├── src/
│   │   │   ├── index.ts     # Main entry point
│   │   │   ├── middleware/  # Auth, rate limiting
│   │   │   └── handlers/    # Request handlers
│   │   └── wrangler.toml    # Worker configuration
│   │
│   └── dashboard/           # Next.js Dashboard
│       ├── src/
│       │   ├── app/         # Pages (App Router)
│       │   ├── lib/         # Utilities
│       │   └── components/  # React components
│       └── package.json
│
├── supabase/
│   └── migrations/          # Database schema
│
├── packages/
│   └── shared/              # Shared types and utilities
│
└── docs/                    # Documentation
```

## 🧪 Testing the System

### 1. Create an Account

1. Open http://localhost:3000
2. Click "Sign Up"
3. Create an account
4. You'll be redirected to the dashboard

### 2. Generate an API Key

1. Go to "API Keys" page
2. Click "Create Key"
3. Give it a name (e.g., "Test Key")
4. Copy the key (you won't see it again!)

### 3. Add Test Credits

For development, add credits manually in Supabase:

```sql
UPDATE balances
SET credits = 10.00
WHERE user_id = 'YOUR_USER_ID';
```

Or use Stripe test mode to purchase credits.

### 4. Make Your First API Call

```bash
curl http://localhost:8787/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### 5. Check Usage

Go to the "Usage" page in the dashboard to see your request logged!

## 💳 Setting Up Payments

### Development (Stripe Test Mode)

1. Use test API keys from Stripe
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any CVC

### Production (Stripe Live Mode)

1. Switch to live API keys
2. Configure webhook endpoint
3. Set up webhook signing secret
4. Test with real card

## 🚀 Deploying to Production

Follow the [Deployment Guide](./docs/DEPLOYMENT.md) to deploy:

1. **Supabase**: Already hosted, just run migrations
2. **Cloudflare Worker**: `wrangler deploy`
3. **Dashboard**: Deploy to Vercel or any Next.js host

## 🎨 Customization

### Change Pricing

Update the markup percentage:

```sql
UPDATE pricing_rules
SET markup_percentage = 25.00  -- 25% markup
WHERE model_pattern = '*';
```

Or add model-specific pricing:

```sql
INSERT INTO pricing_rules (model_pattern, markup_percentage, priority)
VALUES ('gpt-4*', 30.00, 10);
```

### Adjust Rate Limits

```sql
UPDATE rate_limits
SET
  requests_per_minute = 120,
  requests_per_hour = 5000,
  requests_per_day = 50000
WHERE user_id = 'USER_ID';
```

### Customize Credit Packs

Edit `apps/dashboard/src/lib/stripe.ts`:

```typescript
export const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 1000, // $10.00 in cents
    description: 'Perfect for testing',
  },
  // Add more packs...
]
```

### Brand the Dashboard

1. Update colors in `apps/dashboard/tailwind.config.ts`
2. Replace logo in `apps/dashboard/src/app/layout.tsx`
3. Update metadata and titles

## 📊 Monitoring

### View Logs

```bash
# Worker logs
cd apps/worker
wrangler tail

# Vercel logs (if deployed)
vercel logs

# Supabase logs
# Via Supabase Dashboard > Logs
```

### Check Metrics

- **Worker**: Cloudflare Dashboard > Workers > Analytics
- **Database**: Supabase Dashboard > Database > Performance
- **Payments**: Stripe Dashboard > Payments

## 🔒 Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate API keys** regularly
3. **Monitor for abuse** - Check usage patterns
4. **Set rate limits** appropriately
5. **Keep dependencies updated** - Run `npm audit`
6. **Enable 2FA** on all service accounts
7. **Use strong passwords** for admin accounts

## 💰 Pricing Strategy

### Calculating Your Markup

1. Check OpenRouter's pricing: openrouter.ai/models
2. Decide your margin (e.g., 20-40%)
3. Consider your costs:
   - Cloudflare Worker: ~$5/month (beyond free tier)
   - Supabase: $25/month (or free tier)
   - Stripe: 2.9% + $0.30 per transaction
   - Domain/hosting: Variable

### Example Pricing

If OpenRouter charges $0.0005 per request:
- Your cost: $0.0005
- 30% markup: $0.00065
- Profit per 1000 requests: $0.15

## 🤝 Support

### Get Help

- Read the [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
- Check [GitHub Issues](your-repo-url/issues)
- Email support (if you set one up)

### Contributing

If you find bugs or want to add features:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📈 Next Steps

Now that you're set up:

1. ✅ Test the system thoroughly
2. ✅ Customize branding and pricing
3. ✅ Deploy to production
4. ✅ Set up monitoring
5. ✅ Market your API service
6. ✅ Provide great customer support

## 🎉 Congratulations!

You now have a fully functional AI model reseller platform. Happy selling! 🚀

---

**Need help?** Check the docs folder or create an issue on GitHub.
