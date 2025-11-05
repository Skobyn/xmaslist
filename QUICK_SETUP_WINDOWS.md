# ⚡ Quick Setup for Windows (No CLI Required!)

## 🎯 Simplest Way to Get Started

Follow these 3 steps - takes about **5 minutes total**.

---

## Step 1: Create Supabase Project (2 minutes)

1. Go to https://supabase.com and sign up/login
2. Click **"New Project"**
3. Fill in details:
   - **Name**: xmasList
   - **Database Password**: (create a strong password - save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. ⏳ Wait ~2 minutes for database setup

---

## Step 2: Copy Your Credentials (1 minute)

1. Once project is ready, click **Settings** (gear icon) → **API**
2. Copy these three values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

3. Open `.env.local` in your project folder
4. Replace the placeholder values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

---

## Step 3: Run Database Setup (2 minutes)

### Option A: Combined SQL File (Easiest!) ⭐

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open this file: `/supabase/COMBINED_MIGRATION.sql`
4. Copy **ALL** the contents
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. ✅ Done! You should see "Success" message

### Option B: Individual Files (More Control)

Run these files **in order** in Supabase SQL Editor:

1. `supabase/migrations/20240101000000_initial_schema.sql`
2. `supabase/migrations/20240101000001_locations_tables.sql`
3. `supabase/migrations/20240101000002_lists_table.sql`
4. `supabase/migrations/20240101000003_items_table.sql`
5. `supabase/migrations/20240101000004_shares_table.sql`
6. `supabase/migrations/20240101000005_triggers.sql`
7. `supabase/migrations/20240101000006_functions.sql`
8. `supabase/migrations/20240101000007_realtime.sql`

Copy/paste each file and click "Run" after each one.

---

## Step 4: Verify Database Setup (30 seconds)

1. In Supabase dashboard, click **Table Editor** (left sidebar)
2. You should see these tables:
   - ✅ users
   - ✅ locations
   - ✅ location_members
   - ✅ lists
   - ✅ items
   - ✅ shares

If you see all 6 tables, **you're done!** 🎉

---

## Step 5: Start Your App (1 minute)

In PowerShell:

```powershell
# Navigate to your project
cd C:\Users\sbens\Cursor\xmasList

# Start the development server
npm run dev
```

Open your browser to: http://localhost:3000

---

## ✅ You're Ready!

Your xmasList app is now running with a fully configured database!

### What You Can Do Now:

1. **Test the app**: Visit http://localhost:3000
2. **Run tests**: `npm test`
3. **Check coverage**: `npm run test:coverage`
4. **Build for production**: `npm run build`

---

## 🆘 Troubleshooting

### "Connection failed" error

- Check `.env.local` has correct URL and keys
- Verify Supabase project is active (green dot)
- Try restarting the dev server: Ctrl+C then `npm run dev`

### SQL errors in Supabase

- Make sure you copied the **entire** file contents
- Check you're running files in order (if using Option B)
- Try Option A (combined file) instead

### App won't start

```powershell
# Clean install
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

---

## 📚 Next Steps

- Read [GETTING_STARTED.md](GETTING_STARTED.md) for full features
- Check [PROJECT_COMPLETE.md](PROJECT_COMPLETE.md) for architecture
- Review [docs/](docs/) folder for detailed documentation

---

## 💡 Pro Tips

- **Use npx for Supabase commands**: `npx supabase [command]` (no installation needed)
- **Real-time updates**: Enabled by default in your database
- **Row Level Security**: Already configured in migrations
- **Type safety**: Generate TypeScript types with `npx supabase gen types typescript`

---

**You're all set! Start building your Christmas wishlist app! 🎄**
