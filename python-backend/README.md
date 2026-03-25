# Public Prep API - Python Backend

Python/FastAPI backend for Public Prep interview preparation platform, built with Clean Architecture principles.

## Requirements

- Python 3.12+
- PostgreSQL 15+ (or use Docker)

## Project Structure

```
python-backend/
├── src/
│   ├── domain/           # Core business logic (NO external dependencies)
│   │   ├── entities/     # Business entities (User, Interview, etc.)
│   │   ├── errors/       # Domain-specific exceptions
│   │   ├── interfaces/   # Repository contracts (ABCs)
│   │   └── value_objects/# Immutable value types
│   │
│   ├── application/      # Use cases (depends on domain only)
│   │   ├── interfaces/   # Service contracts (AI, Email, Payment)
│   │   ├── services/     # Use case implementations
│   │   └── dto/          # Data transfer objects
│   │
│   ├── infrastructure/   # External concerns
│   │   ├── database/     # SQLAlchemy models & connection
│   │   ├── repositories/ # Repository implementations
│   │   ├── services/     # External service implementations
│   │   ├── observability/# OpenTelemetry & LangFuse setup
│   │   └── di/           # Dependency injection container
│   │
│   └── api/              # FastAPI layer
│       ├── middleware/   # Auth, CORS, rate limiting
│       └── routes/       # API route handlers
│
├── tests/
│   ├── unit/             # Fast, isolated tests
│   ├── integration/      # Tests with real dependencies
│   └── e2e/              # Full API flow tests
│
├── alembic/              # Database migrations
├── pyproject.toml        # Project configuration
└── docker-compose.yml    # Local development services
```

## Local Development Setup

### 1. Create Virtual Environment

```bash
cd python-backend

# Using venv
python3.12 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Or using uv (recommended, faster)
uv venv --python 3.12
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
# Using pip
pip install -e ".[dev]"

# Or using uv
uv pip install -e ".[dev]"
```

### 3. Start PostgreSQL (Docker)

```bash
docker-compose up -d postgres
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Run Database Migrations

```bash
alembic upgrade head
```

### 6. Start Development Server

```bash
uvicorn src.api.main:app --reload --port 5001
```

The API will be available at http://localhost:5001

## Running Tests

```bash
# All tests
pytest

# Unit tests only (fast)
pytest -m unit

# Integration tests
pytest -m integration

# With coverage
pytest --cov=src --cov-report=html

# Type checking
mypy src

# Linting
ruff check src tests
ruff format src tests
```

## Code Quality

This project uses:
- **Ruff** for linting and formatting
- **MyPy** for static type checking (strict mode)
- **Pytest** for testing with async support

Pre-commit checks:
```bash
ruff check src tests
ruff format --check src tests
mypy src
pytest -m unit
```

## Clean Architecture Rules

1. **Domain layer has NO external dependencies** - Pure Python only
2. **Application layer depends on Domain only** - No infrastructure imports
3. **Infrastructure implements Domain interfaces** - Dependency inversion
4. **API layer is thin** - Only HTTP concerns, delegates to services

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for question generation
- `ANTHROPIC_API_KEY` - Anthropic API key (alternative AI provider)
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `SENDGRID_API_KEY` - Email service

## Deployment

This backend is designed to run on Railway alongside the existing TypeScript backend.

```bash
# Railway will use these settings from railway.json
uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
```
