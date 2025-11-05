# 🎄 XmasList - Christmas Wishlist Manager

A beautiful, modern Christmas wishlist application built with Next.js, Mantine UI, and Supabase.

## ✨ Features

- 🎁 **Organize by Retailer** - Create cards for each store
- 🔗 **Auto-Extract Details** - Paste product URLs to auto-fill item details
- 👥 **Family Sharing** - Share wishlists with public links
- ⭐ **Top Choice Stars** - Mark priority items
- 📱 **Mobile Friendly** - Responsive design for shopping on-the-go
- 🎨 **Bold Festive Design** - Modern Christmas theme with Mantine UI

## 🚀 Tech Stack

- **Next.js 14** - React framework
- **Mantine UI v7** - Component library
- **Supabase** - Database and authentication
- **TypeScript** - Type safety
- **Vercel** - Hosting and deployment

## 🛠️ Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## 🔐 Environment Variables

Required environment variables (see `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 📦 Database Setup

Run the migrations in the `supabase/migrations/` directory to set up your database schema.

## 🎉 Deployment

Automatically deploys to Vercel on every push to `main` branch via GitHub Actions.

---

**Merry Christmas! 🎄**
