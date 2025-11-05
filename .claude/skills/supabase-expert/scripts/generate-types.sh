#!/bin/bash

# Generate TypeScript types from Supabase database
# Usage: ./scripts/generate-types.sh [project-id]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Generating TypeScript types from Supabase..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "${RED}Error: Supabase CLI not found${NC}"
  echo ""
  echo "Install with:"
  echo "  npm install -g supabase"
  echo ""
  exit 1
fi

# Get project ID
PROJECT_ID=$1

if [ -z "$PROJECT_ID" ]; then
  # Try to read from .env
  if [ -f ".env.local" ]; then
    SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2 | tr -d ' "')
    PROJECT_ID=$(echo "$SUPABASE_URL" | sed -n 's/.*https:\/\/\([^.]*\).*/\1/p')
  fi

  if [ -z "$PROJECT_ID" ]; then
    echo "${YELLOW}Usage: $0 [project-id]${NC}"
    echo ""
    echo "Or set NEXT_PUBLIC_SUPABASE_URL in .env.local"
    echo ""
    echo "Find your project ID at:"
    echo "  https://app.supabase.com/project/YOUR_PROJECT_ID"
    exit 1
  fi
fi

echo "Project ID: ${GREEN}${PROJECT_ID}${NC}"
echo ""

# Output file
OUTPUT_FILE="lib/database.types.ts"

# Generate types
echo "📝 Generating types..."
npx supabase gen types typescript --project-id "$PROJECT_ID" > "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "${GREEN}✓ Types generated successfully!${NC}"
  echo ""
  echo "Output: ${YELLOW}${OUTPUT_FILE}${NC}"
  echo ""

  # Count tables
  TABLE_COUNT=$(grep -c "Tables: {" "$OUTPUT_FILE" || echo "0")
  echo "Found ${TABLE_COUNT} table(s)"

  # Show usage example
  echo ""
  echo "Usage example:"
  echo ""
  cat << 'EOF'
import { Database } from './lib/database.types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type-safe queries
const { data } = await supabase.from('posts').select('*')
// data is typed as Database['public']['Tables']['posts']['Row'][]

// Type-safe inserts
type NewPost = Database['public']['Tables']['posts']['Insert']
const newPost: NewPost = {
  title: 'My Post',
  content: 'Content here',
  author_id: userId
}
EOF

  echo ""
  echo "${GREEN}✓ Done!${NC}"
else
  echo ""
  echo "${RED}✗ Failed to generate types${NC}"
  echo ""
  echo "Make sure you're logged in to Supabase CLI:"
  echo "  npx supabase login"
  exit 1
fi
