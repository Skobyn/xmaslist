# XmasList Setup Guide

Complete step-by-step guide to set up the XmasList application.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18.17.0 or higher installed
- npm 9.0.0 or higher
- A Supabase account (create one at [supabase.com](https://supabase.com))
- Git installed (optional, for version control)

## Step 1: Environment Setup

### 1.1 Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase
- Zustand
- TanStack Query
- shadcn/ui components

### 1.2 Configure Environment Variables

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Open `.env.local` and update the following variables:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Step 2: Supabase Setup

### 2.1 Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: XmasList
   - Database Password: (create a strong password)
   - Region: (choose closest to your users)
4. Wait for project to be created (1-2 minutes)

### 2.2 Get API Credentials

1. In your Supabase project dashboard:
   - Navigate to Settings → API
   - Copy the following values to your `.env.local`:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2.3 Create Database Schema

In Supabase SQL Editor, run this schema:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2.4 Configure Authentication

1. In Supabase Dashboard, go to Authentication → Settings
2. Configure Email Templates (optional):
   - Customize confirmation, recovery, and magic link emails
3. Configure Auth Providers:
   - Enable Email/Password authentication
   - Configure OAuth providers if needed (Google, GitHub, etc.)

### 2.5 Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

Replace `YOUR_PROJECT_ID` with your actual Supabase project ID (found in Project Settings).

## Step 3: Development Setup

### 3.1 Start Development Server

```bash
npm run dev
```

Your application should now be running at [http://localhost:3000](http://localhost:3000)

### 3.2 Verify Setup

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. You should see the welcome page
3. Check for any console errors

## Step 4: Add UI Components

Install shadcn/ui components as needed:

```bash
# Essential components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add card
npx shadcn@latest add tabs
npx shadcn@latest add toast

# Optional components
npx shadcn@latest add calendar
npx shadcn@latest add select
npx shadcn@latest add popover
```

## Step 5: Testing Authentication

Create a simple authentication flow to test your setup:

1. Create a sign-up page at `src/app/auth/signup/page.tsx`
2. Create a login page at `src/app/auth/login/page.tsx`
3. Test user registration and login
4. Verify user data in Supabase Dashboard → Authentication → Users

## Common Issues and Solutions

### Issue: "Invalid API Key"

**Solution**: Double-check that you've copied the correct `anon/public` key from Supabase, not the `service_role` key.

### Issue: "CORS Error"

**Solution**: Make sure your `NEXT_PUBLIC_APP_URL` is correctly set and matches your development URL.

### Issue: TypeScript Errors

**Solution**:
1. Run `npm run typecheck` to see all errors
2. Ensure all environment variables are properly typed
3. Regenerate database types if schema changed

### Issue: Styles Not Loading

**Solution**:
1. Verify `globals.css` is imported in `layout.tsx`
2. Check Tailwind configuration in `tailwind.config.ts`
3. Clear Next.js cache: `rm -rf .next`

## Next Steps

1. **Create Your First Feature**:
   - Design your wishlist schema
   - Create wishlist components
   - Implement CRUD operations

2. **Set Up Testing**:
   - Install Jest and React Testing Library
   - Write unit tests for components
   - Write integration tests for API routes

3. **Implement Authentication**:
   - Create login/signup pages
   - Add protected routes
   - Implement password recovery

4. **Deploy to Production**:
   - Choose hosting platform (Vercel recommended)
   - Set up production environment variables
   - Configure custom domain (optional)

## Additional Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Supabase Getting Started](https://supabase.com/docs/guides/getting-started)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

If you encounter any issues:
1. Check the documentation
2. Search existing issues on GitHub
3. Create a new issue with detailed error information
4. Join the community Discord (if available)

Happy coding!
