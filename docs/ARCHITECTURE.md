# Architecture Overview

This document explains the technical architecture of the AI Reseller SaaS platform.

## System Components

```
┌─────────────┐
│   End User  │
└──────┬──────┘
       │ API Request
       │ (with API Key)
       ▼
┌──────────────────────────────────┐
│   Cloudflare Worker (Edge)       │
│  ┌────────────────────────────┐  │
│  │  1. Authenticate API Key    │  │
│  │  2. Check Rate Limits       │  │
│  │  3. Check Balance           │  │
│  │  4. Proxy to OpenRouter     │  │
│  │  5. Calculate Cost          │  │
│  │  6. Deduct Credits          │  │
│  │  7. Log Usage               │  │
│  │  8. Return Response         │  │
│  └────────────────────────────┘  │
└─────────┬────────────────────────┘
          │
          ├─────────────────┐
          │                 │
          ▼                 ▼
   ┌────────────┐    ┌──────────────┐
   │  Supabase  │    │  OpenRouter  │
   │  Database  │    │     API      │
   └────────────┘    └──────────────┘
          ▲
          │
          │
   ┌──────────────┐
   │   Next.js    │
   │  Dashboard   │
   │              │
   │  - Auth      │
   │  - API Keys  │
   │  - Usage     │
   │  - Billing   │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │    Stripe    │
   │   Payments   │
   └──────────────┘
```

## Data Flow

### 1. User Registration

```
User → Next.js → Supabase Auth → Trigger → Create User Profile
                                         → Create Balance Record
                                         → Create Rate Limits
```

### 2. API Request Flow

```
Client → Worker → [Auth] → [Rate Limit] → [Balance Check] → OpenRouter
                                                           ↓
         Client ← Worker ← [Log Usage] ← [Deduct Credits] ← Response
```

### 3. Credit Purchase Flow

```
User → Dashboard → Stripe Checkout → Payment
                                    ↓
Dashboard ← Stripe Webhook → Supabase → Add Credits
```

## Technology Stack

### Frontend (Dashboard)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **State Management**: React Hooks
- **UI Components**: Custom + Lucide Icons
- **Charts**: Recharts

### Backend (API Gateway)
- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Language**: TypeScript
- **Authentication**: Custom (API Key + Supabase)
- **Rate Limiting**: Redis-like (Supabase)

### Database
- **Primary**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (optional)
- **Real-time**: Supabase Realtime (optional)

### Payments
- **Processor**: Stripe
- **Method**: Checkout Sessions
- **Webhooks**: Stripe Webhooks
- **Products**: Credit Packs

### AI Provider
- **Provider**: OpenRouter
- **Models**: All OpenRouter models
- **Pricing**: Dynamic based on usage

## Database Schema

### Core Tables

#### users
```sql
- id: UUID (FK to auth.users)
- email: TEXT
- full_name: TEXT
- company: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### api_keys
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- key_hash: TEXT (indexed)
- key_prefix: TEXT
- name: TEXT
- is_active: BOOLEAN
- last_used_at: TIMESTAMP
- created_at: TIMESTAMP
- expires_at: TIMESTAMP
```

#### balances
```sql
- id: UUID (PK)
- user_id: UUID (FK, unique)
- credits: DECIMAL(12,6)
- currency: TEXT
- updated_at: TIMESTAMP
```

#### usage_logs
```sql
- id: UUID (PK)
- user_id: UUID (FK, indexed)
- api_key_id: UUID (FK)
- model: TEXT
- prompt_tokens: INTEGER
- completion_tokens: INTEGER
- total_tokens: INTEGER
- cost_usd: DECIMAL(12,6)
- credits_deducted: DECIMAL(12,6)
- request_metadata: JSONB
- response_metadata: JSONB
- status: TEXT
- created_at: TIMESTAMP (indexed)
```

#### rate_limits
```sql
- id: UUID (PK)
- user_id: UUID (FK, unique)
- requests_per_minute: INTEGER
- requests_per_hour: INTEGER
- requests_per_day: INTEGER
- max_tokens_per_request: INTEGER
- updated_at: TIMESTAMP
```

#### pricing_rules
```sql
- id: UUID (PK)
- model_pattern: TEXT
- markup_percentage: DECIMAL(5,2)
- min_cost_usd: DECIMAL(12,6)
- is_active: BOOLEAN
- priority: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Indexes

- `api_keys.key_hash` - Fast key lookups
- `usage_logs.user_id, created_at` - Usage queries
- `usage_logs.created_at` - Time-based queries
- `request_counters.user_id, window_type, window_start` - Rate limiting

## Security

### API Key Management
- Keys are SHA-256 hashed before storage
- Only prefix shown in UI (e.g., `sk_live_abc1...`)
- Full key shown once during creation
- Keys can be revoked instantly

### Authentication
- Dashboard uses Supabase Auth (JWT)
- API uses custom key-based auth
- Row-Level Security (RLS) on all tables
- Service role key only in Worker (edge)

### Rate Limiting
- Per-user limits on minute/hour/day windows
- Sliding window algorithm
- Configurable per user
- Prevents abuse

### Payment Security
- PCI compliance via Stripe
- Webhook signature verification
- No card data stored
- Secure checkout sessions

## Scalability

### Cloudflare Workers
- Runs on Cloudflare's global edge network
- Auto-scales to handle traffic
- ~0ms cold start
- ~50ms average response time
- Built-in DDoS protection

### Supabase
- Managed PostgreSQL
- Connection pooling
- Automatic backups
- Read replicas (on paid plans)
- Point-in-time recovery

### Cost Efficiency
- Workers: First 100K requests/day free
- Supabase: Free tier supports 50K monthly active users
- Stripe: 2.9% + $0.30 per transaction
- OpenRouter: Pay only for usage

## Monitoring

### Metrics to Track

1. **API Performance**
   - Request latency
   - Success rate
   - Error rate by type
   - OpenRouter response times

2. **Business Metrics**
   - Daily active users
   - Revenue (credits purchased)
   - Margin (revenue - OpenRouter costs)
   - Churn rate

3. **Usage Patterns**
   - Requests per model
   - Average tokens per request
   - Peak usage hours
   - Cost per user

4. **System Health**
   - Worker CPU time
   - Database connections
   - Rate limit hits
   - Balance insufficiencies

### Logging

```typescript
// Worker logs
console.log('Request processed', {
  userId,
  model,
  tokens,
  cost,
  duration
});

// Supabase logs
// Via pg_stat_statements or log explorer

// Stripe logs
// Via Stripe Dashboard > Developers > Logs
```

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────┐
│  Cloudflare Global Network          │
│  ┌──────────────────────────────┐   │
│  │   Worker (api.yourdomain.com)│   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
              │
              ├──────────────────────┐
              │                      │
              ▼                      ▼
┌──────────────────────┐   ┌──────────────────┐
│  Supabase (managed)  │   │  Vercel (edge)   │
│  - Database          │   │  - Dashboard     │
│  - Auth              │   │  - API Routes    │
│  - Storage           │   │  - Stripe        │
└──────────────────────┘   └──────────────────┘
```

### Development Environment

```
┌─────────────────┐
│  localhost:8787 │  ← Worker
└─────────────────┘
        │
        ├───────────────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌─────────────────┐
│ Supabase      │   │ localhost:3000  │
│ (remote)      │   │ ← Dashboard     │
└───────────────┘   └─────────────────┘
```

## Extensibility

### Adding New Features

1. **New Models**
   - OpenRouter automatically provides new models
   - Add custom pricing rules in Supabase
   - No code changes needed

2. **Custom Pricing**
   - Insert new pricing_rules
   - Support wildcards (e.g., `gpt-4*`)
   - Priority-based matching

3. **Webhooks**
   - Add webhook URLs to user settings
   - Trigger on events (low balance, etc.)
   - Retry logic with exponential backoff

4. **Analytics Dashboard**
   - Query usage_logs table
   - Add visualizations with Recharts
   - Real-time updates with Supabase Realtime

## Performance Optimization

### Worker Optimizations
- Minimize compute time
- Use Supabase connection pooling
- Cache pricing rules
- Async logging (fire-and-forget)

### Database Optimizations
- Proper indexing
- Partitioning for usage_logs
- Periodic cleanup of old data
- Use materialized views for analytics

### Frontend Optimizations
- Static page generation
- Image optimization
- Code splitting
- CDN caching

## Disaster Recovery

### Backup Strategy
1. **Database**: Supabase automatic daily backups
2. **Code**: Git repository
3. **Secrets**: 1Password/Vault
4. **Documentation**: This repository

### Recovery Procedures
1. Restore Supabase from backup
2. Redeploy Worker from Git
3. Redeploy Dashboard from Git
4. Restore environment variables
5. Verify functionality

## Future Enhancements

- [ ] Subscription plans with included credits
- [ ] Team/organization support
- [ ] Custom model endpoints
- [ ] Usage alerts and notifications
- [ ] Advanced analytics and reporting
- [ ] White-label options
- [ ] API versioning
- [ ] GraphQL support
- [ ] Mobile app
