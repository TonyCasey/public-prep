# Deployment Workflow

## Branch Strategy

```
feature/* ──PR──> staging ──auto-merge──> main
                     │                      │
                     ▼                      ▼
              Railway Staging        Railway Production
                     │
                     ▼
               E2E Tests
                (pass?)
                     │
                     ▼
              Auto-merge to main
```

## Workflow

1. **Feature Development**
   - Create feature branch from `staging`
   - Open PR targeting `staging`
   - CI runs: lint, type-check, unit tests

2. **Staging Deployment**
   - Merge PR to `staging`
   - Auto-deploys to Railway staging environment
   - E2E tests run against staging

3. **Production Promotion**
   - If E2E tests pass, `staging` auto-merges to `main`
   - `main` auto-deploys to Railway production
   - Health check verifies deployment

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway API token for deployments |
| `VITE_API_URL` | Backend API URL for frontend builds |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key |

## Railway Setup

### Generate Railway Token
```bash
railway login
railway whoami  # Verify logged in
# Go to https://railway.app/account/tokens to create a token
```

### Environment Mapping
- `staging` branch → Railway `staging` environment
- `main` branch → Railway `production` environment

### Required Railway Services (per environment)
- `frontend` - React SPA
- `backend` - Node.js Express API (legacy)
- `python-api` - FastAPI Python backend
- `Postgres` - Database

## URLs

| Environment | URL |
|-------------|-----|
| Production | https://publicprep.ie |
| Staging | https://staging.publicprep.ie |

## Manual Operations

### Skip E2E and force deploy to production
```bash
git checkout main
git merge staging --no-edit
git push origin main
```

### Redeploy without code changes
```bash
railway redeploy --service frontend --environment production
railway redeploy --service python-api --environment production
```

### View deployment logs
```bash
railway logs --service frontend --environment staging
railway logs --service python-api --environment production
```

## Rollback

To rollback production:
1. Find the last good commit on `main`
2. `git revert <bad-commit>` or `git reset --hard <good-commit>`
3. Force push: `git push origin main --force`
4. Railway will auto-redeploy

Or via Railway:
```bash
railway deployment list --service frontend --environment production
railway rollback <deployment-id>
```
# Trigger deploy Tue Mar 31 22:51:38 GMTST 2026
