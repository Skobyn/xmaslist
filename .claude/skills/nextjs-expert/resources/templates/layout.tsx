// Layout Template
// Layouts wrap page content and persist across route changes
// Use for: Shared UI (navigation, footers), nested layouts

import { Inter } from 'next/font/google'
import './globals.css'

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Metadata for SEO
export const metadata = {
  title: {
    default: 'My App',
    template: '%s | My App', // Page title template
  },
  description: 'Description of my app',
  keywords: ['next.js', 'react', 'typescript'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://myapp.com',
    title: 'My App',
    description: 'Description of my app',
    siteName: 'My App',
    images: [{
      url: 'https://myapp.com/og-image.jpg',
      width: 1200,
      height: 630,
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My App',
    description: 'Description of my app',
    images: ['https://myapp.com/twitter-image.jpg'],
    creator: '@yourusername',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Viewport configuration
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
}

interface RootLayoutProps {
  children: React.ReactNode
}

// Root layout - wraps entire app
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        {/* Global providers go here */}
        <Providers>
          {/* Global header */}
          <Header />

          {/* Main content area */}
          <main className="min-h-screen">
            {children}
          </main>

          {/* Global footer */}
          <Footer />
        </Providers>

        {/* Analytics, monitoring, etc. */}
        <Analytics />
      </body>
    </html>
  )
}

// Example: Nested Layout
// Place in app/dashboard/layout.tsx
interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="dashboard-container">
      {/* Dashboard-specific sidebar */}
      <Sidebar />

      <div className="dashboard-content">
        {/* Dashboard header */}
        <DashboardHeader />

        {/* Page content */}
        <div className="dashboard-main">
          {children}
        </div>
      </div>
    </div>
  )
}

// Example: Layout with multiple children (Parallel Routes)
// Place in app/layout.tsx with @modal directory
interface LayoutWithModalProps {
  children: React.ReactNode
  modal: React.ReactNode // Parallel route
}

export function LayoutWithModal({ children, modal }: LayoutWithModalProps) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}

// Example: Client-side Providers
'use client'

import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}

// Example: Header component
function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <Navigation />
        </div>
        <UserMenu />
      </nav>
    </header>
  )
}

// Example: Footer component
function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">About</h3>
            <p className="text-sm text-gray-600">
              Your app description
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">Links</h3>
            <ul className="space-y-2">
              <li><a href="/about">About</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Social</h3>
            {/* Social links */}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
          © 2024 Your App. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

function Logo() {
  return <div className="font-bold text-xl">Logo</div>
}

function Navigation() {
  return (
    <ul className="flex gap-6">
      <li><a href="/">Home</a></li>
      <li><a href="/products">Products</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  )
}

function UserMenu() {
  return <div>User Menu</div>
}

function Sidebar() {
  return (
    <aside className="w-64 bg-gray-50 border-r">
      {/* Sidebar content */}
    </aside>
  )
}

function DashboardHeader() {
  return (
    <div className="h-16 border-b flex items-center px-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </div>
  )
}

function Analytics() {
  return null // Add your analytics provider
}
