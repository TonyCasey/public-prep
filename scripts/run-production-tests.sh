#!/bin/bash

# Production E2E Test Runner
# Run this script after deployment completes

set -e

echo "🚀 Starting Production Environment Tests"
echo "========================================"

# Check if production URL is provided
PRODUCTION_URL=${1:-"https://publicserviceprep.replit.app"}
echo "Testing URL: $PRODUCTION_URL"

# Wait for deployment to be ready
echo "⏳ Waiting for production site to be ready..."
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL" | grep -q "200"; then
        echo "✅ Production site is responding"
        break
    else
        echo "⏳ Attempt $i/30: Site not ready yet, waiting 10 seconds..."
        sleep 10
    fi
done

# Check if site is ready
if ! curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL" | grep -q "200"; then
    echo "❌ Production site is not responding after 5 minutes"
    exit 1
fi

# Set environment variable for tests
export PRODUCTION_URL=$PRODUCTION_URL

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install Playwright browsers if needed
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium

# Run production validation tests
echo "🧪 Running production validation tests..."
npx playwright test --config=e2e/production-config.ts --reporter=html,list

# Generate test report
echo "📊 Generating test report..."
if [ -f "playwright-report/index.html" ]; then
    echo "✅ Test report generated: playwright-report/index.html"
    echo "📱 You can view the report by opening playwright-report/index.html in your browser"
else
    echo "⚠️ Test report not found"
fi

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Production Tests PASSED!"
    echo "=============================="
    echo "✅ All critical user journeys validated"
    echo "✅ Mobile responsiveness confirmed" 
    echo "✅ Payment integration verified"
    echo "✅ Database connectivity confirmed"
    echo "✅ Security measures validated"
    echo ""
    echo "🚀 Production environment is ready for users!"
else
    echo ""
    echo "❌ Production Tests FAILED!"
    echo "=========================="
    echo "Please check the test report for details:"
    echo "📱 Open: playwright-report/index.html"
    echo ""
    exit 1
fi