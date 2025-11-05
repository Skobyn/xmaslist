#!/bin/bash

# Next.js Bundle Analyzer Script
# Analyzes the production bundle size and generates reports
# Usage: ./scripts/analyze-bundle.sh

set -e

echo "🔍 Analyzing Next.js Bundle Size..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if @next/bundle-analyzer is installed
if ! npm list @next/bundle-analyzer &>/dev/null; then
  echo "${YELLOW}Installing @next/bundle-analyzer...${NC}"
  npm install --save-dev @next/bundle-analyzer
fi

# Create temporary config if needed
if [ ! -f "next.config.js" ]; then
  echo "${RED}Error: next.config.js not found${NC}"
  exit 1
fi

# Backup existing config
cp next.config.js next.config.js.backup

# Check if bundle analyzer is already configured
if ! grep -q "bundle-analyzer" next.config.js; then
  echo "${YELLOW}Adding bundle analyzer to config...${NC}"

  cat > next.config.analyzer.js << 'EOF'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = require('./next.config.js')

module.exports = withBundleAnalyzer(nextConfig)
EOF
fi

echo ""
echo "📦 Building production bundle..."
echo ""

# Build with analyzer
ANALYZE=true npm run build

echo ""
echo "${GREEN}✓ Bundle analysis complete!${NC}"
echo ""

# Calculate sizes
if [ -d ".next" ]; then
  echo "📊 Bundle Size Report:"
  echo ""

  # Total .next directory size
  NEXT_SIZE=$(du -sh .next | cut -f1)
  echo "  Total .next directory: ${YELLOW}${NEXT_SIZE}${NC}"

  # Static directory size
  if [ -d ".next/static" ]; then
    STATIC_SIZE=$(du -sh .next/static | cut -f1)
    echo "  Static assets: ${YELLOW}${STATIC_SIZE}${NC}"
  fi

  # Server directory size
  if [ -d ".next/server" ]; then
    SERVER_SIZE=$(du -sh .next/server | cut -f1)
    echo "  Server bundle: ${YELLOW}${SERVER_SIZE}${NC}"
  fi

  echo ""

  # List largest files
  echo "📁 Largest Chunks:"
  echo ""
  find .next/static -type f -name "*.js" -exec du -h {} + | sort -rh | head -10 | while read size file; do
    filename=$(basename "$file")
    echo "  ${size} - ${filename}"
  done
fi

echo ""
echo "${GREEN}✓ Analysis reports opened in browser${NC}"
echo ""

# Show recommendations
echo "💡 Recommendations:"
echo ""

# Check for large dependencies
if [ -f "package.json" ]; then
  echo "  Checking for large dependencies..."

  # Check for common large packages
  LARGE_PACKAGES=("moment" "lodash" "date-fns" "axios" "react-dom")

  for pkg in "${LARGE_PACKAGES[@]}"; do
    if grep -q "\"$pkg\"" package.json; then
      case $pkg in
        "moment")
          echo "  ${YELLOW}⚠${NC}  Found 'moment' - Consider using 'date-fns' or 'dayjs' (smaller alternatives)"
          ;;
        "lodash")
          echo "  ${YELLOW}⚠${NC}  Found 'lodash' - Import specific functions: import debounce from 'lodash/debounce'"
          ;;
        *)
          ;;
      esac
    fi
  done
fi

echo ""
echo "  • Use dynamic imports for large components"
echo "  • Enable tree-shaking with ES modules"
echo "  • Optimize images with next/image"
echo "  • Remove unused dependencies"
echo "  • Use next/font for font optimization"

echo ""
echo "${GREEN}✓ Complete!${NC}"
echo ""

# Restore original config if we created a temporary one
if [ -f "next.config.js.backup" ]; then
  mv next.config.js.backup next.config.js
  if [ -f "next.config.analyzer.js" ]; then
    rm next.config.analyzer.js
  fi
fi

# Instructions
echo "To view detailed analysis:"
echo "  1. Check the opened browser tabs"
echo "  2. Look for .next/analyze/ directory for saved reports"
echo ""
