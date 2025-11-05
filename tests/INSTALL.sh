#!/bin/bash

# Test Suite Installation Script
# Christmas Wishlist Application

set -e

echo "🎄 Christmas Wishlist - Test Suite Installation"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js $(node --version) detected"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✓ npm $(npm --version) detected"
echo ""

# Install dependencies
echo "📦 Installing test dependencies..."
npm install

echo ""
echo "✓ Dependencies installed successfully"
echo ""

# Setup environment file
if [ ! -f .env.test ]; then
    echo "📝 Creating .env.test file..."
    cp .env.test.example .env.test
    echo "⚠️  Please update .env.test with your test environment variables"
else
    echo "✓ .env.test already exists"
fi

echo ""

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install

echo ""
echo "✓ Playwright browsers installed"
echo ""

# Run a quick test to verify setup
echo "🧪 Running verification test..."
npm test -- --testPathPattern=metadata-extractor --passWithNoTests

echo ""
echo "================================================"
echo "✅ Test suite installation complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env.test with your configuration"
echo "  2. Run 'npm test' to run all tests"
echo "  3. Run 'npm run test:coverage' for coverage report"
echo "  4. Run 'npm run test:e2e' for end-to-end tests"
echo ""
echo "Documentation:"
echo "  - README.md - Test suite overview"
echo "  - TESTING_GUIDE.md - Detailed testing guide"
echo ""
echo "Happy testing! 🎉"
