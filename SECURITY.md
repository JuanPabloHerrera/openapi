# Security Guide

This document outlines the security measures implemented in this application and best practices for maintaining security.

## Environment Variables & Secrets Management

### Critical Backend Secrets

The following environment variables contain sensitive credentials and **MUST NEVER** be exposed to the frontend or committed to git:

- `SUPABASE_SERVICE_ROLE_KEY` - Full database access, bypasses Row Level Security
- `OPENROUTER_API_KEY` - API access key for OpenRouter AI service
- `STRIPE_SECRET_KEY` - Stripe payment processing secret key
- `STRIPE_WEBHOOK_SECRET` - Verifies Stripe webhook authenticity

### Public Variables (Safe for Frontend)

These variables are prefixed with `NEXT_PUBLIC_` and are safe to expose:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (RLS enforced)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `NEXT_PUBLIC_APP_URL` - Application URL

### Storage Locations

1. **Dashboard (Next.js)**: Store secrets in `.env.local` or `.env.production`
2. **Cloudflare Worker**: Use `wrangler secret put` command, NOT `.dev.vars` for production

```bash
# Setting Cloudflare Worker secrets for production
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put OPENROUTER_API_KEY
wrangler secret put SUPABASE_URL
```

3. **Local Development**: Use `.dev.vars` for worker (NEVER commit this file)

### Git Protection

The following files are gitignored to prevent secret exposure:

- `.env`, `.env.local`, `.env*.local`
- `.env.production`
- `.dev.vars` (Cloudflare Worker secrets)
- `apps/worker/.dev.vars`

**IMPORTANT**: Always verify secrets are not tracked before committing:
```bash
git status --porcelain | grep -E "(\.env|\.dev\.vars)"
```

## Authentication & Authorization

### Next.js Dashboard Authentication

- Middleware protects `/dashboard/*` and `/api/keys/*` routes
- Session validation via Supabase JWT tokens in httpOnly cookies
- Tokens: `sb-access-token`, `sb-refresh-token`
- Password requirements: Minimum 12 characters

### Cloudflare Worker API Authentication

- Bearer token authentication with API keys
- Keys are SHA-256 hashed in database
- Format: `sk_live_{64 hex characters}`
- Keys never expire (as per requirements) but can be deactivated

## Security Features Implemented

### 1. CORS Protection
- Worker restricts origins to whitelisted domains
- Configured via `ALLOWED_ORIGINS` environment variable
- Default: `localhost:3000`, `localhost:3001` for development

### 2. Rate Limiting
- API key creation: Max 5 keys per hour per user
- Worker rate limiting: Per-user limits on requests (minute/hour/day windows)

### 3. Webhook Security
- Stripe webhooks verify signature using `STRIPE_WEBHOOK_SECRET`
- Idempotency check prevents duplicate payment processing
- Payment intents are checked before adding credits

### 4. Input Validation
- User authentication required for all sensitive operations
- API key format validation (must start with `sk_`)
- Request body validation in all API routes

### 5. Secure Logging
- No API keys or secrets logged to console
- Minimal debug information in production
- Request/response metadata stored for audit purposes

## Database Security

### Row Level Security (RLS)

Ensure Supabase RLS policies are enabled on all tables:

```sql
-- Example: Users can only read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Example: Users can only access their own API keys
CREATE POLICY "Users can view own api keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);
```

### Service Role Key Usage

The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and should only be used:
- In backend API routes
- In Cloudflare Worker
- In administrative scripts
- NEVER in frontend code

## API Security Best Practices

### Creating API Keys

1. Keys are generated with cryptographic randomness
2. Only the hash is stored in the database
3. Plain key shown only once to user
4. Rate limited to prevent abuse

### Using API Keys

1. Always use HTTPS in production
2. Store keys in environment variables or secrets managers
3. Rotate keys periodically even though they don't expire
4. Deactivate compromised keys immediately

## Cloudflare Worker Security

### Secrets Management

Production secrets should NEVER be in code or `.dev.vars`:

```bash
# Set production secrets via CLI
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put OPENROUTER_API_KEY
```

### CORS Configuration

Update `ALLOWED_ORIGINS` in production:

```bash
# For worker
wrangler secret put ALLOWED_ORIGINS
# Value: https://yourdomain.com,https://app.yourdomain.com
```

## Utility Scripts Security

The following scripts are for administrative use only:

- `add-credits.js` - Requires user ID/email as parameter
- `check-usage.js` - Requires user ID/email as parameter
- `check-key.js` - For debugging API keys
- `test-api.js` - For testing API connectivity

**NEVER** run these scripts with production credentials on untrusted machines.

### Usage

```bash
# Add credits to specific user
node add-credits.js user@example.com 25.00

# Check usage for specific user
node check-usage.js user@example.com

# Debug API key
node check-key.js sk_live_abc123...
```

## Incident Response

### If Secrets Are Compromised

1. **Immediately rotate all affected credentials**:
   - Supabase: Generate new service role key in dashboard
   - OpenRouter: Regenerate API key
   - Stripe: Roll secret keys in dashboard
   - Cloudflare: Update secrets via `wrangler secret put`

2. **Review access logs**:
   - Check Supabase logs for unauthorized access
   - Review usage_logs table for anomalous API calls
   - Check Stripe dashboard for suspicious payments

3. **Revoke affected API keys**:
   ```sql
   UPDATE api_keys SET is_active = false
   WHERE created_at < 'compromise_timestamp';
   ```

4. **Notify users if necessary**

### If API Keys Are Leaked

1. Deactivate compromised keys immediately in dashboard
2. User can generate new keys
3. Monitor usage_logs for abuse
4. No need to rotate backend secrets

## Monitoring & Auditing

### What to Monitor

- Failed authentication attempts
- Rate limit violations
- Unusual API usage patterns
- Large credit deductions
- Failed webhook verifications

### Logging

All API calls are logged to `usage_logs` table with:
- Timestamp
- User ID and API key ID
- Model and tokens used
- Cost and credits deducted
- Request/response status

### Alerts

Consider setting up alerts for:
- Multiple failed auth attempts
- API keys created/deleted
- Large credit purchases
- Unusual spending patterns
- Webhook failures

## Production Deployment Checklist

- [ ] All secrets stored in environment variables (not in code)
- [ ] `.env.local` and `.dev.vars` in `.gitignore`
- [ ] Cloudflare Worker secrets set via `wrangler secret put`
- [ ] CORS configured with production domain
- [ ] Supabase RLS policies enabled
- [ ] HTTPS enforced for all endpoints
- [ ] Stripe webhook endpoint configured with correct secret
- [ ] Rate limiting configured appropriately
- [ ] Monitoring and logging enabled
- [ ] Password requirements set to minimum 12 characters
- [ ] Authentication middleware enabled
- [ ] Database backups configured

## Security Contacts

For security issues or vulnerabilities, please contact: [your-email]

## Regular Security Tasks

### Weekly
- Review access logs for anomalies
- Check for failed authentication attempts
- Monitor credit usage patterns

### Monthly
- Review and update RLS policies
- Audit API key usage
- Review user accounts for suspicious activity
- Check for outdated dependencies

### Quarterly
- Consider rotating service role keys
- Review and update security policies
- Conduct security audit
- Update dependencies

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Stripe Security](https://stripe.com/docs/security)
- [Cloudflare Workers Security](https://developers.cloudflare.com/workers/platform/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
