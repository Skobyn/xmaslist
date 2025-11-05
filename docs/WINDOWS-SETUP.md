# 🪟 Windows Setup Guide for xmasList

## Supabase CLI Installation on Windows

The Supabase CLI **no longer supports** `npm install -g supabase`. Here are your options:

---

## Option 1: Use npx (Easiest - No Installation) ⭐

You don't need to install Supabase CLI! Just use `npx`:

```bash
# Link to your project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push

# Any other command
npx supabase [command]
```

**This is the recommended approach!** It always uses the latest version.

---

## Option 2: Scoop Package Manager (Windows)

### Install Scoop (if not already installed):

```powershell
# Run in PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

### Install Supabase CLI:

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Verify installation:

```powershell
supabase --version
```

---

## Option 3: Manual SQL Migration (No CLI Needed) 🚀

If you don't want to install anything, just copy/paste SQL directly into Supabase:

### Step-by-Step:

1. **Go to your Supabase project**
   - Visit https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor" in the left sidebar

2. **Run migrations in order**

   Copy/paste each file from `/supabase/migrations/` in this order:

   ```
   1. 20240101000000_initial_schema.sql
   2. 20240101000001_locations_tables.sql
   3. 20240101000002_lists_table.sql
   4. 20240101000003_items_table.sql
   5. 20240101000004_shares_table.sql
   6. 20240101000005_triggers.sql
   7. 20240101000006_functions.sql
   8. 20240101000007_realtime.sql
   ```

3. **Click "Run" after each file**

4. **Verify tables created**
   - Click "Table Editor" in left sidebar
   - You should see: users, locations, location_members, lists, items, shares

---

## Quick Start (No CLI Required)

### 1. Create Supabase Project

```
1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Choose organization
5. Enter project details:
   - Name: xmasList
   - Database Password: (save this!)
   - Region: (closest to you)
6. Click "Create new project"
7. Wait ~2 minutes for setup
```

### 2. Get Your Credentials

```
1. Go to Settings (gear icon) → API
2. Copy these values:

   Project URL: https://xxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc...
```

### 3. Update Environment Variables

Open `.env.local` and update:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Run SQL Migrations Manually

**Option A: Individual Files** (Recommended)

Open Supabase SQL Editor and run each file one by one:

```sql
-- File 1: 20240101000000_initial_schema.sql
-- Copy entire contents and run

-- File 2: 20240101000001_locations_tables.sql
-- Copy entire contents and run

-- ... continue for all 8 files
```

**Option B: All-in-One** (Advanced)

I can create a single combined SQL file for you.

### 5. Verify Setup

```powershell
# In your project directory
npm run dev
```

Open http://localhost:3000

---

## Alternative: Use WSL (Windows Subsystem for Linux)

If you prefer Linux tools on Windows:

```bash
# Install Supabase CLI in WSL
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh

# Navigate to your project
cd /mnt/c/Users/sbens/Cursor/xmasList

# Link and push
supabase link --project-ref your-ref
supabase db push
```

---

## Recommended Approach for Windows Users

**For Development:**
- ✅ Use `npx supabase [command]` (no installation needed)
- ✅ Or use manual SQL copy/paste (simplest for beginners)

**For Production:**
- ✅ Use Scoop package manager
- ✅ Or use WSL for full Linux tooling

---

## Common Issues

### "operation not permitted, rmdir"
- This is from the old failed installation
- Ignore it - just use `npx` instead

### "could not determine executable to run"
- Don't use `npx install` - just use `npx supabase`

### SQL Editor errors
- Make sure you run migrations in order
- Check for syntax errors (copy entire file)
- Verify previous migration succeeded first

---

## Next Steps

Once database is set up:

```powershell
# 1. Verify environment variables
cat .env.local

# 2. Start development server
npm run dev

# 3. Open browser
start http://localhost:3000

# 4. Run tests
npm test
```

---

## Need Help?

- 📘 Check main [GETTING_STARTED.md](../GETTING_STARTED.md)
- 📗 Review [docs/SETUP-GUIDE.md](SETUP-GUIDE.md)
- 🗄️ Database migrations: [supabase/migrations/](../supabase/migrations/)

---

**Recommendation**: Use **Option 3 (Manual SQL)** to get started quickly without any CLI installation! 🚀
