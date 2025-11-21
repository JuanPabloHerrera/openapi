# Troubleshooting Guide

Common issues and their solutions.

## Installation Issues

### npm install fails

**Problem:** Dependencies fail to install

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lockfiles
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Turbo not found

**Problem:** `turbo: command not found`

**Solution:**
```bash
npm install -g turbo
# OR
npx turbo dev
```

## Database Issues

### Supabase migrations fail

**Problem:** `supabase db push` fails

**Solution:**
```bash
# Check if you're linked to correct project
supabase projects list
supabase link --project-ref YOUR_PROJECT_ID

# Try resetting (WARNING: deletes data)
supabase db reset

# Or apply migrations manually
supabase db push
```

### RLS policies blocking requests

**Problem:** Can't read/write data from dashboard

**Solution:**
Check your RLS policies in Supabase SQL Editor:
```sql
-- Temporarily disable RLS for testing
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
```

### "relation does not exist" error

**Problem:** Table not found

**Solution:**
```bash
# Ensure migrations ran successfully
cd supabase
supabase db push

# Check if tables exist
supabase db execute "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

## Worker Issues

### Worker fails to deploy

**Problem:** `wrangler deploy` fails

**Solution:**
```bash
# Login to Cloudflare
wrangler logout
wrangler login

# Check wrangler.toml is correct
cat apps/worker/wrangler.toml

# Build before deploying
cd apps/worker
npm run build
wrangler deploy
```

### Worker returns 500 errors

**Problem:** Internal server error

**Solution:**
```bash
# Check Worker logs
wrangler tail

# Verify secrets are set
wrangler secret list

# Test locally first
wrangler dev
```

### "Module not found" in Worker

**Problem:** Import errors

**Solution:**
```bash
# Ensure dependencies are installed
cd apps/worker
npm install

# Check TypeScript compilation
npm run build

# Verify imports use correct paths
# Worker doesn't support aliases like @/
```

## Authentication Issues

### Can't sign up

**Problem:** Sign up fails silently

**Solution:**
1. Check Supabase Auth settings
2. Disable email confirmation for development:
   - Go to Supabase > Authentication > Settings
   - Disable "Enable email confirmations"

### User profile not created

**Problem:** User exists but no profile in `users` table

**Solution:**
Check if trigger is working:
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Manually create profile
INSERT INTO public.users (id, email, full_name)
VALUES ('USER_ID', 'email@example.com', 'Name');
```

### Session expires immediately

**Problem:** User logged out after refresh

**Solution:**
1. Check Site URL in Supabase matches your domain
2. Verify cookies are enabled
3. Check CORS settings

## API Issues

### 401 Unauthorized

**Problem:** API key not working

**Possible Causes:**
1. API key is incorrect
2. API key is inactive
3. API key expired
4. Worker can't connect to Supabase

**Solution:**
```bash
# Test API key exists in database
# (run in Supabase SQL Editor)
SELECT id, name, is_active, expires_at
FROM api_keys
WHERE key_prefix = 'sk_live_abc1';

# Regenerate API key from dashboard
```

### 402 Insufficient Credits

**Problem:** Not enough balance

**Solution:**
1. Add test credits manually:
```sql
UPDATE balances
SET credits = credits + 10.00
WHERE user_id = 'YOUR_USER_ID';
```

2. Or purchase credits via Stripe in dashboard

### 429 Rate Limited

**Problem:** Too many requests

**Solution:**
1. Check rate limits:
```sql
SELECT * FROM rate_limits WHERE user_id = 'YOUR_USER_ID';
```

2. Increase limits:
```sql
UPDATE rate_limits
SET
  requests_per_minute = 120,
  requests_per_hour = 5000
WHERE user_id = 'YOUR_USER_ID';
```

3. Clear request counters:
```sql
DELETE FROM request_counters WHERE user_id = 'YOUR_USER_ID';
```

### OpenRouter errors

**Problem:** Requests failing at OpenRouter

**Solution:**
1. Check OpenRouter API key is valid
2. Verify OpenRouter account has credits
3. Check model name is correct
4. Review OpenRouter status page

## Stripe Issues

### Webhook not receiving events

**Problem:** Payments not updating balance

**Solution:**

For local development:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

For production:
1. Verify webhook URL in Stripe dashboard
2. Check webhook signing secret is correct
3. View webhook logs in Stripe dashboard

### Checkout fails

**Problem:** Can't complete purchase

**Solution:**
1. Check Stripe keys (test vs live)
2. Use test card: `4242 4242 4242 4242`
3. Check browser console for errors
4. Verify CORS settings

## Dashboard Issues

### Blank page after login

**Problem:** Dashboard doesn't load

**Solution:**
1. Check browser console for errors
2. Verify environment variables:
```bash
cat apps/dashboard/.env.local
```

3. Check middleware:
```bash
# Ensure middleware.ts exists
ls apps/dashboard/src/middleware.ts
```

### API calls fail from dashboard

**Problem:** Dashboard can't call backend APIs

**Solution:**
1. Check NEXT_PUBLIC_SUPABASE_URL is set
2. Verify CORS in Worker
3. Check network tab in browser DevTools

### Styling broken

**Problem:** No styles applied

**Solution:**
```bash
# Rebuild Tailwind
cd apps/dashboard
npm run build

# Check if globals.css is imported
grep -r "import.*globals.css" src/app
```

## Performance Issues

### Slow API responses

**Problem:** High latency

**Possible Causes:**
1. Cold start (first request)
2. Supabase connection issues
3. OpenRouter delays
4. Complex database queries

**Solution:**
1. Add caching for pricing rules
2. Optimize database queries
3. Use Supabase connection pooling
4. Monitor Worker metrics

### Database connection errors

**Problem:** Too many connections

**Solution:**
```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Use connection pooling in Supabase
# Settings > Database > Connection Pooling
```

## Development Issues

### Hot reload not working

**Problem:** Changes not reflecting

**Solution:**
```bash
# Restart dev servers
# Kill processes
pkill -f "next dev"
pkill -f "wrangler dev"

# Restart
npm run dev
```

### TypeScript errors

**Problem:** Type checking fails

**Solution:**
```bash
# Regenerate types
cd apps/dashboard
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts

# Check tsconfig.json
cat tsconfig.json
```

## Production Issues

### Worker not updating

**Problem:** Changes not deploying

**Solution:**
```bash
# Hard refresh deployment
cd apps/worker
wrangler deploy --force

# Clear Cloudflare cache
# Cloudflare Dashboard > Caching > Purge Everything
```

### Environment variables missing

**Problem:** Secrets not available

**Solution:**
```bash
# List secrets
wrangler secret list

# Set missing secrets
wrangler secret put SECRET_NAME

# For Vercel
vercel env pull
```

## Getting Help

### Debug Checklist

Before asking for help:

- [ ] Check error messages in console
- [ ] Review logs (Worker, Vercel, Supabase)
- [ ] Verify environment variables
- [ ] Test with curl/Postman
- [ ] Check recent code changes
- [ ] Try in incognito/private mode
- [ ] Review this troubleshooting guide

### Useful Commands

```bash
# Check Worker logs
wrangler tail

# Check Vercel logs
vercel logs

# Check Supabase logs
# Via Supabase Dashboard > Logs

# Test API endpoint
curl -v https://your-worker.workers.dev/health

# Check database
supabase db execute "SELECT version();"

# Verify Stripe webhook
stripe events list --limit 5
```

### Log Collection

When reporting issues, include:

1. **Error message** (full text)
2. **Worker logs** (`wrangler tail`)
3. **Browser console** (screenshot)
4. **Network request** (cURL or screenshot)
5. **Environment** (dev/production)
6. **Steps to reproduce**

## Still Stuck?

1. Search [GitHub Issues](your-repo-url/issues)
2. Create a new issue with logs and details
3. Join Discord community (if available)
4. Email support@yourdomain.com
