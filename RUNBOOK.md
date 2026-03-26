# Production Runbook

## Environment Variables

| Variable | Source | Scope | Required |
|----------|--------|-------|----------|
| `CLERK_SECRET_KEY` | Clerk Dashboard or `vercel integration add clerk` | Server | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard | Client | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Set to `/sign-in` | Client | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Set to `/sign-up` | Client | Yes |
| `DATABASE_URL` | Neon Console or `vercel integration add neon` | Server | Yes |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | [Mapbox Account](https://account.mapbox.com/access-tokens/) | Client | Yes |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) | Server | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Webhooks | Server | Yes |
| `STRIPE_PRICE_ID` | Stripe Dashboard > Products > Price ID | Server | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | Client | Yes |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` | Server | Yes |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL | Client | Yes |
| `VERCEL_OIDC_TOKEN` | Auto-provisioned by `vercel env pull` | Server | Auto |

### Provisioning Steps

1. `vercel link` — connect to Vercel project
2. `vercel integration add clerk` — install Clerk (requires terminal acceptance)
3. `vercel integration add neon` — install Neon Postgres
4. Complete Clerk setup in Vercel Dashboard
5. `vercel env pull .env.local` — pull all env vars locally
6. Set `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` manually
7. Create Stripe product ($15/mo) in Stripe Dashboard, copy Price ID
8. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel
9. Create Mapbox account, get public token, set NEXT_PUBLIC_MAPBOX_TOKEN
10. Generate CRON_SECRET: `openssl rand -hex 32`, set in Vercel

## Database Migrations

```bash
# Generate migration from schema changes
bun run db:generate

# Review generated SQL in drizzle/ directory
cat drizzle/XXXX_*.sql

# Apply migrations to production
bun run db:migrate

# Seed visa rules (first time only)
bun run db:seed
```

**Rollback**: Drizzle Kit has no built-in rollback. Write a manual SQL migration to reverse changes if needed.

**Tables**: users, traveler_profiles, passports, visa_rules, itineraries, trip_legs, subscriptions, notifications, visa_rule_changes

## Stripe Webhook Configuration

**Endpoint URL**: `https://<your-domain>/api/webhooks/stripe`

**Events to subscribe**:
- `checkout.session.completed` — creates subscription record
- `customer.subscription.updated` — updates status + period end
- `customer.subscription.deleted` — marks subscription as canceled

**Setup**:
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint with your production URL
3. Select the 3 events above
4. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET`

**Testing locally**: Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Vercel Cron Jobs

Configured in `vercel.json`:
```json
{ "crons": [{ "path": "/api/cron/check-deadlines", "schedule": "0 8 * * *" }] }
```

- Runs daily at 8 AM UTC
- Secured by `CRON_SECRET` bearer token (validated in the route handler)
- Scans active itineraries for upcoming visa deadlines (14/7/3 day warnings)

## Monitoring

- **Vercel Dashboard**: Function logs, deployment status, analytics
- **Neon Dashboard**: Database metrics, query performance, connection count
- **Clerk Dashboard**: User sessions, auth events
- **Stripe Dashboard**: Subscription metrics, webhook delivery status

## Common Operations

**Deploy to production**: `vercel --prod` or push to `main` branch

**Check function logs**: `vercel logs <deployment-url>`

**Pull latest env vars**: `vercel env pull .env.local`

**Run locally**: `bun dev` (requires .env.local with all vars set)
