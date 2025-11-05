# 🗄️ Supabase Database Migration Guide

## ✅ Quick Setup (5 Minutes)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in details:
   - Name: xmasList
   - Database Password: (create strong password)
   - Region: (choose closest)
4. Wait ~2 minutes for setup

### Step 2: Get Your Credentials
1. Go to Settings → API
2. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbGc...
   service_role: eyJhbGc...
   ```
3. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

### Step 3: Run Database Migration
1. In Supabase, click **SQL Editor**
2. Click **"New query"**
3. Open: **`supabase/COMPLETE_MIGRATION_FIXED.sql`**
4. Copy **ALL** contents (600+ lines)
5. Paste into SQL Editor
6. Click **"Run"** (Ctrl+Enter)
7. ✅ Wait for success message

### Step 4: Verify Tables Created
Click **Table Editor** and verify you see:
- ✅ users
- ✅ locations
- ✅ location_members
- ✅ lists
- ✅ items
- ✅ shares

---

## ✅ Migration Fixed Issues

The migration file was updated to fix:
1. **Circular dependency**: `shares` table is now created before RLS policies reference it
2. **Immutable function error**: Removed `NOW()` from index WHERE clause (line 297)

---

## 🗄️ What Gets Created

### Tables (6)
- **users** - User profiles
- **locations** - Store/place cards
- **location_members** - Collaboration at location level
- **lists** - Christmas wishlists
- **items** - Wishlist items
- **shares** - Sharing permissions

### Security
- Row Level Security (RLS) on all tables
- 30+ RLS policies for granular permissions
- Auto-validation triggers

### Features
- Auto-update timestamps
- Purchase validation
- Share permission validation
- Full-text search on items
- Real-time subscriptions enabled

### Helper Functions (7)
- `has_list_access()` - Check list permissions
- `has_location_access()` - Check location permissions
- `get_list_stats()` - Item counts, totals, completion %
- `get_location_stats()` - List/member/item counts
- `search_items()` - Full-text search
- `share_resource_batch()` - Batch sharing
- `get_user_accessible_lists()` - Get all accessible lists

---

## 🆘 Troubleshooting

### Error: "extension uuid-ossp does not exist"
**Fix:** Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Error: "type share_role already exists"
**Fix:** Tables partially created. Either:
1. **Start fresh** (drop all and retry):
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   -- Then run migration again
   ```

2. **Or skip to missing parts** (advanced)

### Error: "relation already exists"
**Fix:** Some tables already created. Options:
1. Drop specific tables and retry
2. Run individual migration files from `/supabase/migrations/`

### Error: "functions in index predicate must be marked IMMUTABLE"
**Status:** ✅ FIXED in `COMPLETE_MIGRATION_FIXED.sql`
- Removed `NOW()` from index predicate (not allowed)
- Changed to regular composite index

---

## 🧪 Test Your Setup

After migration completes:

```bash
# 1. Start your app
npm run dev

# 2. Open browser
http://localhost:3000

# 3. Check Supabase connection
# You should be able to:
# - Register/login (magic link)
# - Create locations
# - Create lists
# - Add items
```

---

## 📊 Database Schema

```
auth.users (Supabase managed)
    ↓
public.users
    ↓
public.locations
    ↓
public.lists
    ↓
public.items

public.location_members (many-to-many: users ↔ locations)
public.shares (sharing: locations & lists)
```

### Key Relationships
- Users own locations
- Locations contain lists
- Lists contain items
- Locations can have members
- Locations and lists can be shared

---

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can only see their own data
- Shared resources accessible based on permissions
- Public lists visible to everyone
- Location members have access to location lists

### Permission Levels
- **viewer** - Read-only access
- **editor** - Can add/edit items
- **admin** - Full control (share, delete)

### Purchase Privacy
- Purchased items hidden from list owner
- "Surprise preservation" built-in

---

## ✅ You're Ready!

After running the migration:
1. Update `.env.local` with credentials
2. Start dev server: `npm run dev`
3. Open http://localhost:3000
4. Start building! 🎄

---

## 📚 Additional Resources

- [GETTING_STARTED.md](GETTING_STARTED.md) - Full project setup
- [PROJECT_COMPLETE.md](PROJECT_COMPLETE.md) - Architecture overview
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Detailed architecture
- [docs/SETUP-GUIDE.md](docs/SETUP-GUIDE.md) - Comprehensive setup

---

**Migration file:** `supabase/COMPLETE_MIGRATION_FIXED.sql`

**Status:** ✅ Ready to run (all issues fixed)
