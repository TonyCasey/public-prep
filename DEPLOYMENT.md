# Deployment Guide

This document explains how to deploy the Public Service Interview Prep application with a separated architecture:
- **Client (Frontend)**: Deployed to Vercel
- **Server (Backend API)**: Deployed to Heroku

## Architecture Overview

- **Vercel**: Hosts the React frontend application (client/)
- **Heroku**: Hosts the Express.js backend API (server/)
- **Database**: Neon PostgreSQL (cloud hosted)

The client communicates with the server via HTTPS API calls, configured through environment variables.

## Prerequisites

### General Requirements
- GitHub repository with the code
- Environment variables configured
- Database setup (Neon PostgreSQL)

### Required Services
- **Vercel Account**: [vercel.com](https://vercel.com)
- **Heroku Account**: [heroku.com](https://heroku.com)
- **Neon Database**: [neon.tech](https://neon.tech)

## Environment Variables

### Client (Vercel) Environment Variables

```env
# API Connection
VITE_API_URL=https://your-app-name.herokuapp.com  # Your Heroku backend URL

# Stripe Public Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Server (Heroku) Environment Variables

```env
# Database
DATABASE_URL=postgresql://neondb_owner:xxxxx@ep-super-glade-a9u5f42c-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require
DATABASE_URL_PROD=<production-database-url>  # Optional: separate production DB

# OpenAI Integration
OPENAI_API_KEY=sk-xxxxx

# Voice Recognition
DEEPGRAM_API_KEY=xxxxx

# Stripe Payment Processing  
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email Service
SENDGRID_API_KEY=SG.xxxxx

# CRM Integration (Optional)
MONDAY_API_KEY=xxxxx
HUBSPOT_API_KEY=xxxxx

# Production Settings
NODE_ENV=production
PORT=5000  # Heroku will set this automatically

# CORS Settings (to allow Vercel frontend)
CORS_ORIGIN=https://your-app.vercel.app
```

## Vercel Deployment

### 1. Setup Vercel Project

1. **Connect GitHub Repository**:
   ```bash
   npx vercel --prod
   ```
   Or connect via Vercel dashboard at [vercel.com/new](https://vercel.com/new)

2. **Configure Project Settings**:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm ci`

### 2. Required GitHub Secrets

Add these secrets in GitHub Settings > Secrets and variables > Actions:

```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>

# All environment variables listed above
DATABASE_URL=<your-database-url>
OPENAI_API_KEY=<your-openai-key>
DEEPGRAM_API_KEY=<your-deepgram-key>
STRIPE_SECRET_KEY=<your-stripe-secret>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
```

### 3. Get Vercel Credentials

```bash
# Install Vercel CLI
npm install -g vercel

# Login and get credentials
vercel login
vercel link

# Get project info
cat .vercel/project.json
```

### 4. Deployment Process

The workflow automatically:
- **On Pull Requests**: Deploys preview builds
- **On Main Branch Push**: Deploys to production
- Runs tests before deployment
- Builds the application with environment variables

## Heroku Deployment

### 1. Create Heroku App

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create new app
heroku create your-app-name

# Add Node.js buildpack
heroku buildpacks:set heroku/nodejs
```

### 2. Required GitHub Secrets

Add these secrets in GitHub Settings:

```
HEROKU_API_KEY=<your-heroku-api-key>
HEROKU_APP_NAME=<your-heroku-app-name>
HEROKU_EMAIL=<your-heroku-email>

# All environment variables (same as Vercel)
DATABASE_URL_PROD=<production-database-url>
# ... other environment variables
```

### 3. Get Heroku Credentials

```bash
# Get API key
heroku auth:token

# App name is what you created above
```

### 4. Configure Heroku Environment

Set environment variables in Heroku dashboard or via CLI:

```bash
heroku config:set DATABASE_URL="postgresql://..." --app your-app-name
heroku config:set OPENAI_API_KEY="sk-..." --app your-app-name
heroku config:set NODE_ENV="production" --app your-app-name
# ... set all other environment variables
```

### 5. Deployment Process

The workflow automatically:
- Runs tests before deployment
- Builds the application
- Deploys to Heroku
- Runs database migrations (if needed)
- Performs health check
- **Manual Trigger**: Can be triggered manually via GitHub Actions

## Database Setup

### Neon PostgreSQL Configuration

1. **Create Neon Project**: [console.neon.tech](https://console.neon.tech)
2. **Get Connection String**: Copy the connection string from Neon dashboard
3. **Environment-Specific URLs**:
   - Development: Use main database URL
   - Production: Consider creating separate production database

### Database Migrations

The application uses Drizzle ORM. To run migrations:

```bash
# Local development
npm run db:push

# Production (via Heroku CLI)
heroku run npm run db:push --app your-app-name
```

## CI/CD Pipeline

### Workflow Triggers

**Vercel**:
- Push to main → Production deployment
- Pull requests → Preview deployment

**Heroku**:
- Push to main → Production deployment
- Manual trigger available

### Testing Pipeline

Both workflows include:
1. **Dependency Installation**: `npm ci`
2. **Type Checking**: `npm run check`
3. **Unit Tests**: `npx vitest run --coverage`
4. **Build Verification**: `npm run build`

### Health Checks

- **Vercel**: Automatic via Vercel's monitoring
- **Heroku**: Custom health check at `/api/health`

## Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Check environment variables are set
# Verify all dependencies in package.json
# Check TypeScript compilation errors
```

**Database Connection Issues**:
```bash
# Verify DATABASE_URL format
# Check Neon database status
# Ensure connection pooling is configured
```

**Deployment Timeouts**:
```bash
# Increase build timeout in workflow
# Optimize build process
# Check for memory usage issues
```

### Debugging Commands

```bash
# Check Vercel deployment logs
vercel logs your-deployment-url

# Check Heroku logs
heroku logs --tail --app your-app-name

# Test health check locally
curl http://localhost:5000/api/health
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **Database**: Use separate production database
3. **API Keys**: Rotate keys regularly
4. **CORS**: Configure for production domains
5. **Rate Limiting**: Implement for production

## Monitoring

### Vercel
- Built-in analytics and monitoring
- Function logs available in dashboard
- Custom monitoring via Vercel API

### Heroku
- Application metrics in dashboard
- Log aggregation via add-ons
- Custom monitoring with services like DataDog

## Scaling Considerations

**Vercel**:
- Automatic scaling for serverless functions
- CDN for static assets
- Edge network optimization

**Heroku**:
- Manual dyno scaling
- Database connection pooling
- Add-ons for caching and monitoring

---

## Quick Setup Checklist

### Vercel
- [ ] Connect GitHub repository to Vercel
- [ ] Add GitHub secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
- [ ] Add environment variables as GitHub secrets
- [ ] Push to main branch to trigger deployment

### Heroku
- [ ] Create Heroku app
- [ ] Add GitHub secrets (HEROKU_API_KEY, HEROKU_APP_NAME, HEROKU_EMAIL)
- [ ] Set environment variables in Heroku
- [ ] Push to main branch or manually trigger deployment

Both deployments will be automatically configured through the GitHub Actions workflows!