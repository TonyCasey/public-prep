# Public Prep - AI-Powered Interview Preparation Platform

A full-stack TypeScript application that helps users prepare for interviews with AI-powered feedback, speech recognition, and structured evaluation using the STAR method.

## 🚀 Features

- **AI-Powered Interview Simulation** - Generate contextual questions based on job descriptions
- **Voice Recording & Analysis** - Multiple speech recognition implementations (Deepgram, WebSpeech API, Whisper)
- **STAR Method Evaluation** - Structured answer assessment framework
- **Progress Tracking** - Competency-based performance metrics
- **CV/Resume Processing** - Automated competency extraction from uploaded documents
- **Subscription Management** - Tiered pricing with usage quotas via Stripe
- **CRM Integration** - Monday.com and HubSpot connectors for tracking

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based auth
- **Payments**: Stripe integration with webhooks
- **AI Services**: OpenAI/Anthropic for question generation and evaluation
- **Speech Processing**: Deepgram SDK for professional speech-to-text
- **Email**: SendGrid for transactional emails
- **UI Components**: Radix UI primitives with shadcn/ui
- **Styling**: Tailwind CSS

### Directory Structure
```
├── frontend/src/        # React frontend application
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility functions and configurations
├── backend/            # Express.js backend
│   ├── server/         # Server implementation
│   │   ├── routes/     # API route handlers
│   │   ├── services/   # Business logic services
│   │   ├── middleware/ # Express middleware
│   │   └── auth.ts     # Authentication setup
│   └── migrations/     # Database migration files
├── shared/             # Shared types and schemas
├── e2e/               # Playwright E2E tests
└── test/              # Vitest unit tests
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- Git
- A text editor/IDE (VS Code recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd public-prep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy the example environment file
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your configuration
   ```

   **Required Environment Variables:**
   ```env
   # Database (pre-configured Neon PostgreSQL)
   DATABASE_URL=postgresql://...
   
   # Session Security
   SESSION_SECRET=your-session-secret-here
   
   # AI Services (choose one or both)
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   
   # Speech Recognition
   DEEPGRAM_API_KEY=your-deepgram-key
   
   # Payment Processing
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Email Service (optional)
   SENDGRID_API_KEY=SG....
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   
   # CRM Integration (optional)
   MONDAY_API_KEY=your-monday-key
   HUBSPOT_API_KEY=your-hubspot-key
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## 📜 Available Scripts

### Development
```bash
npm run dev              # Start development server (backend + frontend)
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm start                # Start production server
```

### Building
```bash
npm run build            # Build both frontend and backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only
```

### Database
```bash
npm run db:push          # Push schema changes to database
```

### Testing
```bash
# Unit Tests
npx vitest               # Run unit tests
npx vitest --ui          # Run with UI
npx vitest --coverage    # Run with coverage

# E2E Tests
npx playwright test      # Run E2E tests
npx playwright test --ui # Run with Playwright UI
npx playwright test --headed # Run with visible browser

# Type Checking
npm run check            # TypeScript validation
```

## 🔧 Configuration

### Path Aliases
- `@/*` → `frontend/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `frontend/src/assets/*`

### Environment-Specific Behavior
- **Development**: Uses Vite dev server with HMR
- **Production**: Serves built static files from Express
- **Database**: Session store uses PostgreSQL with connect-pg-simple

## 🧪 Testing Strategy

- **Unit Tests**: Vitest for utilities and services
- **E2E Tests**: Playwright covering complete user journeys
- **Integration Tests**: Supertest for API endpoints
- **Coverage**: JSDoc coverage reporting

Test coverage includes:
- Payment flows and Stripe webhooks
- Speech recognition implementations
- File upload and processing
- Authentication flows
- CRM integrations

## 🚀 Deployment

The application supports multiple deployment platforms:

### Heroku
See `DEPLOYMENT.md` for detailed Heroku deployment instructions.

### Vercel
Frontend can be deployed to Vercel with backend on separate service.

### Local Production
```bash
npm run build
npm start
```

## 🔐 Security Considerations

- Session-based authentication with secure session storage
- API rate limiting and request logging
- Environment-based configuration management
- CORS protection for API endpoints
- Input validation with Zod schemas
- SQL injection protection via Drizzle ORM

## 📚 Key Features Deep Dive

### Interview Simulation
- AI generates contextual questions based on job descriptions
- Multiple question types and difficulty levels
- Industry-specific question sets

### Speech Recognition
- **Deepgram**: Professional-grade speech-to-text
- **WebSpeech API**: Browser-native recognition
- **Whisper**: OpenAI's speech recognition model
- Real-time transcription with confidence scoring

### STAR Method Analysis
- **Situation**: Context identification
- **Task**: Responsibility analysis
- **Action**: Specific actions taken
- **Result**: Outcome measurement
- AI-powered evaluation and feedback

### Progress Tracking
- Competency-based scoring system
- Historical performance analysis
- Improvement recommendations
- Export capabilities for progress reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes following the existing code style
4. Run tests: `npm run check && npx vitest && npx playwright test`
5. Commit your changes: `git commit -m 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

### Development Guidelines
- Follow existing TypeScript and React patterns
- Use the established component library (shadcn/ui)
- Write unit tests for new functionality
- Update E2E tests for user-facing changes
- Run type checking before committing

## 📄 License

MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: See `CLAUDE.md` for development guidance
- **Deployment**: See `DEPLOYMENT.md` for deployment instructions
- **Issues**: Create an issue on the repository for bug reports or feature requests

## 🔗 Related Services

- **Database**: Neon PostgreSQL (serverless)
- **AI Services**: OpenAI GPT-4, Anthropic Claude
- **Speech**: Deepgram speech recognition
- **Payments**: Stripe payment processing
- **Email**: SendGrid transactional emails
- **CRM**: Monday.com, HubSpot integrations

---

Built with ❤️ using modern TypeScript, React, and Node.js