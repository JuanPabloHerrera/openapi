# 🚀 AI Reseller SaaS Platform

A complete, production-ready platform for reselling AI models via OpenRouter. Built with modern edge infrastructure for global performance and scalability.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-F38020?style=flat&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=flat&logo=stripe&logoColor=white)](https://stripe.com/)

## ✨ What This Is

A turnkey SaaS platform that lets you resell AI models (GPT-4, Claude, Llama, etc.) with your own branding, pricing, and billing. Your users get a simple API key and you handle the billing - making profit on the markup.

**Perfect for:**
- Entrepreneurs launching an AI API business
- Agencies needing AI access for clients
- Companies building AI products
- Developers wanting passive income from AI reselling

## 🎯 Key Features

### For Your Business
- ✅ **20% default markup** on all requests (fully configurable)
- ✅ **Stripe integration** for credit pack purchases
- ✅ **Usage tracking** with detailed analytics
- ✅ **Automatic billing** - credits deducted after each request
- ✅ **Multi-model support** - All OpenRouter models available

### For Your Users
- ✅ **Simple API keys** - One key for all models
- ✅ **Pay-as-you-go** - Buy credits, use as needed
- ✅ **Real-time dashboard** - Monitor usage and costs
- ✅ **OpenAI-compatible** - Drop-in replacement for OpenAI SDK
- ✅ **Global performance** - Edge deployment for low latency

### Technical
- ✅ **Production-ready** - Battle-tested architecture
- ✅ **Secure** - API key hashing, RLS policies, rate limiting
- ✅ **Scalable** - Handles millions of requests
- ✅ **Documented** - Comprehensive guides and API docs
- ✅ **Type-safe** - TypeScript throughout

## 🏗️ Architecture

```
┌─────────────┐
│   End User  │
└──────┬──────┘
       │ API Request (Bearer Token)
       ▼
┌──────────────────────────────────┐
│   Cloudflare Worker (Edge)       │
│  • Authenticate API Key           │
│  • Check Rate Limits              │
│  • Check Balance                  │
│  • Proxy to OpenRouter           │
│  • Calculate Cost                 │
│  • Deduct Credits                 │
│  • Log Usage                      │
└─────────┬────────────────────────┘
          │
          ├─────────────────┐
          ▼                 ▼
   ┌────────────┐    ┌──────────────┐
   │  Supabase  │    │  OpenRouter  │
   │  • Auth    │    │  • GPT-4     │
   │  • DB      │    │  • Claude    │
   │  • Logs    │    │  • Llama     │
   └────────────┘    └──────────────┘
          ▲
          │
   ┌──────────────┐
   │   Next.js    │
   │  Dashboard   │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │    Stripe    │
   └──────────────┘
```

## 📦 What's Included

```
openapi/
├── apps/
│   ├── worker/              # Cloudflare Worker (API Gateway)
│   │   ├── src/
│   │   │   ├── index.ts             # Main entry point
│   │   │   ├── middleware/          # Auth & rate limiting
│   │   │   └── handlers/            # Request proxying
│   │   └── wrangler.toml            # Worker config
│   │
│   └── dashboard/           # Next.js Dashboard
│       ├── src/
│       │   ├── app/                 # Pages (App Router)
│       │   │   ├── page.tsx         # Landing page
│       │   │   ├── auth/            # Login/Signup
│       │   │   ├── dashboard/       # User dashboard
│       │   │   └── api/             # API routes
│       │   └── lib/                 # Utilities
│       └── package.json
│
├── supabase/
│   └── migrations/          # Complete database schema
│       ├── 20240101000000_initial_schema.sql
│       └── 20240102000000_rate_limit_functions.sql
│
├── packages/
│   └── shared/              # Shared TypeScript types
│
├── docs/                    # Comprehensive documentation
│   ├── QUICK_START.md       # 10-minute setup guide
│   ├── DEPLOYMENT.md        # Production deployment
│   ├── API.md               # API reference
│   ├── ARCHITECTURE.md      # Technical details
│   └── TROUBLESHOOTING.md   # Common issues
│
├── scripts/
│   └── setup.sh             # Automated setup script
│
└── .env.example             # Environment template
```

## ⚡ Quick Start (5 Minutes)

### Automated Setup (Recommended)

```bash
# Clone the repo
git clone <your-repo-url>
cd openapi

# Run automated setup
./scripts/setup.sh

# Follow the prompts - it will:
# 1. Install all dependencies
# 2. Set up environment variables
# 3. Configure Supabase
# 4. Guide you through the rest
```

### Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Set up Supabase
cd supabase
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
cd ..

# 4. Start development servers

# Terminal 1: Worker
cd apps/worker
npm run dev
# Running at http://localhost:8787

# Terminal 2: Dashboard
cd apps/dashboard
npm run dev
# Running at http://localhost:3000
```

## 🔑 Required API Keys

You'll need accounts and API keys from:

1. **[Supabase](https://supabase.com)** (Free tier available)
   - Project URL
   - Anon key
   - Service role key

2. **[OpenRouter](https://openrouter.ai)** (Pay as you go)
   - API key
   - Add credits to your account

3. **[Stripe](https://stripe.com)** (Free for testing)
   - Publishable key
   - Secret key
   - Webhook secret

4. **[Cloudflare](https://cloudflare.com)** (Free tier: 100k requests/day)
   - Account for Worker deployment

## 🧪 Test It Out

```bash
# 1. Create an account at http://localhost:3000

# 2. Generate an API key from the dashboard

# 3. Make your first API call
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

## 📚 Documentation

- **[📖 Getting Started](./GETTING_STARTED.md)** - Comprehensive overview
- **[⚡ Quick Start](./docs/QUICK_START.md)** - 10-minute setup guide
- **[🚀 Deployment](./docs/DEPLOYMENT.md)** - Deploy to production
- **[📘 API Reference](./docs/API.md)** - Complete API documentation
- **[🏗️ Architecture](./docs/ARCHITECTURE.md)** - Technical deep dive
- **[🔧 Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues

## 💰 Business Model

### How You Make Money

1. **Markup on API usage** - Default 20% on top of OpenRouter costs
2. **Credit pack sales** - Users buy credits upfront via Stripe
3. **Optional subscriptions** - Infrastructure supports monthly plans

### Example Economics

```
User buys: $50 credit pack
They use: $40 worth of API calls

Your revenue: $50
Your costs: ~$32 (at 20% markup)
Your profit: ~$18 (36% margin)

User's remaining balance: $10 (for future use)
```

### Pricing Tiers (Customizable)

- **Starter**: $10 → $10 credits
- **Pro**: $45 → $50 credits (10% bonus)
- **Enterprise**: $160 → $200 credits (25% bonus)

## 🎨 Customization

### Adjust Pricing

```sql
-- Change default markup
UPDATE pricing_rules
SET markup_percentage = 30.00  -- 30% markup
WHERE model_pattern = '*';

-- Add model-specific pricing
INSERT INTO pricing_rules (model_pattern, markup_percentage, priority)
VALUES ('gpt-4*', 40.00, 10);  -- 40% markup for GPT-4
```

### Change Rate Limits

```sql
UPDATE rate_limits
SET
  requests_per_minute = 120,
  requests_per_hour = 5000
WHERE user_id = 'USER_ID';
```

### Customize Branding

- Edit `apps/dashboard/tailwind.config.ts` for colors
- Update logos in `apps/dashboard/src/app/layout.tsx`
- Modify credit packs in `apps/dashboard/src/lib/stripe.ts`

## 🚀 Deployment

### Deploy to Production

```bash
# 1. Deploy Worker
cd apps/worker
wrangler login
wrangler deploy
# Note the URL: https://your-worker.workers.dev

# 2. Deploy Dashboard (Vercel)
cd apps/dashboard
npm install -g vercel
vercel
# Add environment variables in Vercel dashboard

# 3. Configure Stripe webhook
# Point to: https://your-domain.com/api/stripe/webhook
```

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

## 📊 What Users Get

1. **Sign up** on your branded dashboard
2. **Buy credits** via Stripe checkout
3. **Generate API keys** instantly
4. **Make requests** using OpenAI-compatible format
5. **Get billed** automatically based on usage
6. **Monitor everything** in real-time dashboard

## 🔒 Security

- ✅ API keys hashed with SHA-256 (never stored in plain text)
- ✅ Row-Level Security (RLS) on all database tables
- ✅ Rate limiting to prevent abuse
- ✅ Balance checks before processing requests
- ✅ Webhook signature verification
- ✅ CORS properly configured
- ✅ No sensitive data in logs

## 📈 Monitoring

Track key metrics:
- Daily/Monthly Active Users
- Total API Requests
- Revenue (credits purchased)
- Costs (OpenRouter expenses)
- Profit Margin
- Popular Models
- Error Rates

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use for commercial projects

## 💡 Need Help?

- 📖 Read the [documentation](./docs)
- 🐛 Check [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- 💬 Create an [issue](https://github.com/your-repo/issues)

## ⭐ Show Your Support

If this helped you launch your AI API business, please star the repo!

---

**Built with ❤️ using TypeScript, Cloudflare Workers, Supabase, Next.js, and Stripe**

Ready to launch your AI API business? Get started in 5 minutes! 🚀
