# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
npm run dev              # Start development server (both API and client)
npm run build            # Build application for production
npm start                # Start production server
npm run check            # TypeScript type checking
```

### Database
```bash
npm run db:push          # Push database schema changes via Drizzle
```

### Testing
```bash
# Unit Tests (Vitest)
npx vitest               # Run unit tests
npx vitest --ui          # Run with UI mode
npx vitest --coverage    # Run with coverage report
npx vitest specific.test.ts # Run specific test file

# E2E Tests (Playwright)
npx playwright test      # Run all E2E tests
npx playwright test --ui # Run with UI mode
npx playwright test --debug # Run in debug mode
npx playwright test production-validation.spec.ts # Run specific suite
npx playwright test --headed # Run with browser visible (debugging)

# Linting & Type Checking
npm run check            # TypeScript type checking (required before commits)
```

## Project Architecture

This is a full-stack TypeScript application for interview preparation with AI-powered feedback.

### Core Structure
- **Frontend**: React + TypeScript with Vite bundler
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **Payment Processing**: Stripe integration
- **AI Services**: OpenAI for question generation and answer evaluation
- **Voice Processing**: Deepgram SDK for speech recognition

### Directory Structure
```
├── client/src/          # React frontend application
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility functions and configurations
├── server/             # Express.js backend
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic services
│   ├── middleware/     # Express middleware
│   └── auth.ts         # Authentication setup
├── shared/             # Shared types and schemas
├── migrations/         # Database migration files
├── e2e/               # Playwright E2E tests
└── test/              # Vitest unit tests
```

### Key Features
- **Interview Simulation**: AI-generated questions based on job descriptions
- **Speech Recognition**: Multiple voice recording implementations (Deepgram, WebSpeech API)
- **STAR Method Analysis**: Structured answer evaluation framework
- **Progress Tracking**: Competency-based performance metrics
- **File Processing**: CV/resume parsing with competency extraction
- **Subscription Management**: Tiered pricing with usage quotas
- **CRM Integration**: Monday.com and HubSpot connectors

### Database Schema
- Uses Drizzle ORM with PostgreSQL
- Main entities: Users, Interviews, Questions, Answers, Documents
- Session-based authentication with connect-pg-simple
- UUID-based primary keys throughout

### API Architecture
- RESTful API with Express routes in `/server/routes/`
- Middleware for authentication, rate limiting, and request logging
- Centralized error handling
- File upload handling with Multer

### Frontend Architecture
- React 18 with TypeScript and Vite
- Component library using Radix UI primitives
- Tailwind CSS for styling with shadcn/ui components
- React Query for server state management
- Wouter for client-side routing
- Custom hooks for authentication, payments, and tracking

### Environment Configuration
- Development: Runs on port 5000 with Vite dev server
- Production: Serves static build with Express  
- Environment variables required: DATABASE_URL (pre-configured), various API keys
- Optimized for local development (Replit dependencies removed)

### Testing Strategy
- **Unit Tests**: Vitest with JSDoc coverage for utilities and services
- **E2E Tests**: Playwright covering complete user journeys
- **Integration Tests**: API endpoint testing with Supertest
- Test coverage includes payment flows, speech recognition, and file uploads

### Notable Integrations
- **Stripe**: Complete payment processing with webhooks
- **OpenAI**: Question generation and answer evaluation
- **Deepgram**: Professional speech-to-text service
- **SendGrid**: Transactional email service
- **Monday.com/HubSpot**: CRM tracking and analytics

## Local Development Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- Git for version control
- A text editor/IDE (VS Code recommended)

### Getting Started
1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd public-prep
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env` and configure your API keys
   - The DATABASE_URL is already set to the provided Neon PostgreSQL connection
   - Add your API keys for OpenAI/Anthropic, Deepgram, etc. as needed

3. **Database Setup**
   ```bash
   npm run db:push          # Push schema to database (creates tables)
   ```

4. **Start Development**
   ```bash
   npm run dev              # Start development server on port 5000
   ```

### Local Development Notes
- Server runs on port 5000 with both API and frontend served
- Frontend uses Vite dev server with HMR for React components
- Database migrations handled via Drizzle Kit with Neon PostgreSQL
- Session-based authentication with PostgreSQL session store
- Replit dependencies have been removed for local development

### Path Aliases
- `@/*` → `client/src/*` (frontend components and utilities)
- `@shared/*` → `shared/*` (shared types and schemas between frontend/backend)

### Important Development Notes
- Always run `npm run check` for TypeScript validation before commits
- Use the existing shadcn/ui component library for UI consistency
- Follow the established patterns for new API routes in `server/routes/`
- Speech recognition has multiple implementations (Deepgram, WebSpeech, Whisper)
- Payment flows require careful testing with Stripe webhooks