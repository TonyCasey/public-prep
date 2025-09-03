# E2E Test Suite

## Overview
Comprehensive end-to-end testing for the Public Prep application using Playwright.

## Test Structure

### Core Test Suites

#### `user-flow.spec.ts`
- Complete user registration to payment flow
- Mobile responsiveness testing
- Performance validation
- File upload validation
- Accessibility standards

#### `production-validation.spec.ts`
- Homepage loading and core elements
- Sample question evaluation
- User registration flow
- Payment integration checks
- Mobile responsiveness
- API health checks
- SEO and meta tags
- Security headers validation

#### `component-flows.spec.ts`
- CV upload and analysis flow
- Interview session creation
- Speech recognition testing
- Answer submission and evaluation
- Progress tracking
- Export functionality

#### `error-handling.spec.ts`
- Network failure handling
- Invalid credentials
- File upload errors
- Missing required fields
- Session expiration
- Browser navigation
- Concurrent sessions

### Payment Flow Tests

#### `complete-25-step-flow.spec.ts`
- Complete 25-step user journey from sample question to dual subscription tiers
- Full payment workflow validation

#### `stripe-payment-test.spec.ts`
- Stripe integration testing
- Payment form validation
- Checkout session creation

#### `starter-upgrade-flow.spec.ts`
- Starter to premium upgrade flow
- Analytics display validation
- Pricing variations

### Production Tests

#### `final-validation.spec.ts`
- Final production validation
- Complete user journey verification
- System readiness checks

#### `full-user-journey.spec.ts`
- Comprehensive user journey testing
- Sample question to lifetime package flow

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test suite
npx playwright test user-flow.spec.ts

# Run with UI mode
npx playwright test --ui

# Run in debug mode
npx playwright test --debug
```

## Test Configuration

Tests are configured to run:
- Single worker for Replit environment
- Extended timeouts for payment flows
- Automatic screenshot and trace capture on failures
- Headless mode by default (configurable)

## Browser Support

Tests run on Chromium by default with:
- Desktop Chrome configuration
- 1280x720 viewport
- Mobile responsive testing included