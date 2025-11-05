# Christmas Wishlist Application - Technical Specification

**Version:** 1.0
**Last Updated:** 2025-01-02
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [Technical Architecture](#technical-architecture)
6. [Database Schema](#database-schema)
7. [API Specification](#api-specification)
8. [User Interface Requirements](#user-interface-requirements)
9. [Security Requirements](#security-requirements)
10. [Acceptance Criteria](#acceptance-criteria)

---

## 1. Executive Summary

### 1.1 Purpose

The Christmas Wishlist Application is a location-based collaborative wishlist platform designed to help families coordinate gift-giving across multiple locations (e.g., "Mom's House", "Dad's House"). The application differentiates itself through:

- **Location-based organization**: Group wishlists by physical locations
- **Real-time collaboration**: Multiple users can simultaneously edit and view lists
- **URL parsing**: Automatically extract product details from retailer links
- **Purchase coordination**: Prevent duplicate gift purchases with reservation system
- **Offline support**: Progressive Web App with full offline functionality

### 1.2 Target Users

- **Primary**: Families coordinating Christmas gift exchanges
- **Secondary**: Extended family members, friends, and gift-givers
- **Tertiary**: Event planners organizing group gift exchanges

### 1.3 Core Value Proposition

Unlike traditional wishlist platforms (Amazon Wish List, Babylist, MyRegistry) that focus on individual lists, this application organizes wishlists by physical locations where gifts will be exchanged, making it ideal for families with divorced parents, multiple households, or complex holiday gatherings.

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  Mobile PWA  │  │   Browser    │     │
│  │  (Next.js)   │  │  (Installed) │  │  Extension   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │       API GATEWAY (Next.js)       │
          │         REST + WebSocket          │
          └─────────────────┬─────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │         SUPABASE PLATFORM         │
          │  ┌─────────────────────────────┐  │
          │  │    PostgreSQL Database      │  │
          │  │   (Lists, Items, Members)   │  │
          │  └─────────────────────────────┘  │
          │  ┌─────────────────────────────┐  │
          │  │    Realtime Subscriptions   │  │
          │  │   (Phoenix Channels/WSS)    │  │
          │  └─────────────────────────────┘  │
          │  ┌─────────────────────────────┐  │
          │  │    Authentication Service   │  │
          │  │  (Magic Links + OAuth 2.0)  │  │
          │  └─────────────────────────────┘  │
          │  ┌─────────────────────────────┐  │
          │  │    Storage Service (S3)     │  │
          │  │  (Images, Avatars, Files)   │  │
          │  └─────────────────────────────┘  │
          └───────────────────────────────────┘
```

### 2.2 Technology Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand + React Query
- **Offline Storage**: Dexie.js (IndexedDB wrapper)
- **PWA**: next-pwa

#### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL 15+
- **Real-time**: Supabase Realtime (Phoenix Channels)
- **Authentication**: Supabase Auth + Magic Links
- **Storage**: Supabase Storage (S3-compatible)
- **API**: Next.js API Routes + Supabase PostgREST

#### Infrastructure
- **Hosting**: Vercel (frontend)
- **Database Hosting**: Supabase Cloud
- **CDN**: Vercel Edge Network + Cloudinary (images)
- **Email**: Resend
- **Monitoring**: Sentry + Plausible Analytics

---

## 3. Functional Requirements

### 3.1 User Management

#### FR-1.1: User Registration
**Priority**: High
**Story**: As a new user, I want to create an account so I can manage my wishlists

**Acceptance Criteria**:
- User can register with email using magic link (no password required)
- User can register with Google OAuth
- User can register with Facebook OAuth
- User receives email verification link
- User profile is created with default settings
- User can optionally add display name and avatar

**Technical Notes**:
- Use Supabase Auth for authentication
- Implement NextAuth.js for social login providers
- Store user metadata in `users` table

#### FR-1.2: Guest Access
**Priority**: High
**Story**: As a family member, I want to view wishlists without creating an account

**Acceptance Criteria**:
- Guest users can access public lists via share link
- Guest users can view items but cannot mark as purchased
- Guest session persists for 90 days in localStorage
- Prompt to create account after adding items or marking purchases
- Guest data can be migrated to registered account

---

### 3.2 Location Management

#### FR-2.1: Create Location
**Priority**: High
**Story**: As a user, I want to create locations where gift exchanges happen

**Acceptance Criteria**:
- User can create location with name (required) and description (optional)
- Location has unique ID and timestamp
- Creator becomes owner with admin privileges
- Location appears in user's location list immediately

#### FR-2.2: Manage Location Members
**Priority**: High
**Story**: As a location owner, I want to invite family members to collaborate

**Acceptance Criteria**:
- Owner can invite users by email
- Invited users receive email invitation
- Members can have roles: viewer, contributor, editor, admin
- Owner can change member roles
- Owner can remove members
- Member list shows avatars, names, and roles

**Roles Definition**:
| Role | View Lists | Add Items | Edit Items | Manage Members | Delete Location |
|------|-----------|-----------|-----------|----------------|-----------------|
| Viewer | ✅ | ❌ | ❌ | ❌ | ❌ |
| Contributor | ✅ | ✅ | Own only | ❌ | ❌ |
| Editor | ✅ | ✅ | ✅ | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |

---

### 3.3 Wishlist Management

#### FR-3.1: Create Wishlist
**Priority**: High
**Story**: As a user, I want to create a wishlist for Christmas 2024

**Acceptance Criteria**:
- User can create list with title (required), description, and year
- List is associated with a location
- List has privacy settings (private/shared/public)
- List has unique shareable link
- List has optional theme color
- List appears in location's list view

#### FR-3.2: Share Wishlist
**Priority**: High
**Story**: As a list owner, I want to share my wishlist with family members

**Acceptance Criteria**:
- Generate unique share link for each list
- Share link works without authentication for public lists
- Share link can have expiration date
- Copy link to clipboard with one click
- Generate QR code for printing on cards
- Send invitation via email
- Track who accessed via share link

#### FR-3.3: Manage Wishlist Privacy
**Priority**: Medium
**Story**: As a list owner, I want to control who can see my wishlist

**Acceptance Criteria**:
- Three privacy levels: Private (owner only), Shared (invited users), Public (anyone with link)
- Privacy can be changed at any time
- Private lists require explicit member invitation
- Public lists visible to anyone with link but cannot be edited by guests

---

### 3.4 Item Management

#### FR-4.1: Add Item Manually
**Priority**: High
**Story**: As a user, I want to add items to my wishlist

**Acceptance Criteria**:
- User can add item with title (required)
- Optional fields: description, price, currency, URL, quantity
- User can upload item image or provide image URL
- User can set priority: low, medium, high
- Item appears in list immediately (optimistic update)
- Item syncs to server in background

#### FR-4.2: Add Item from URL
**Priority**: High
**Story**: As a user, I want to paste a product URL and have details auto-filled

**Acceptance Criteria**:
- User pastes URL from Amazon, Target, Walmart, Etsy, or other retailer
- System extracts product title, price, image, and description via Open Graph tags
- User can edit extracted information before saving
- Fallback to manual entry if parsing fails
- Support for batch URL import (paste multiple URLs)
- Cache parsed product data for 7 days

**Supported Retailers**:
- Amazon (ASIN extraction)
- Target (TCIN extraction)
- Walmart (__NEXT_DATA__ extraction)
- Etsy
- Best Buy
- Generic (Open Graph fallback)

#### FR-4.3: Mark Item as Purchased
**Priority**: Critical
**Story**: As a gift-giver, I want to mark an item as purchased so others don't buy duplicates

**Acceptance Criteria**:
- User can mark item as purchased
- System creates 10-minute reservation before finalizing
- If user cancels, reservation is released
- Purchased items hidden from list owner (surprise preservation)
- Purchased items visible to other shoppers with "claimed" status
- Purchaser identity hidden from list owner, visible to admins
- Real-time notification to other users when item is purchased

#### FR-4.4: Edit and Delete Items
**Priority**: High
**Story**: As a user, I want to modify or remove items from my wishlist

**Acceptance Criteria**:
- User can edit own items anytime
- Editors can edit any items in lists they have access to
- Deletion requires confirmation modal
- Purchased items cannot be deleted (only unmarked)
- Changes sync in real-time to all viewers

---

### 3.5 Real-Time Collaboration

#### FR-5.1: Real-Time Synchronization
**Priority**: High
**Story**: As a user, I want to see updates from other users instantly

**Acceptance Criteria**:
- Changes appear to all connected users within 1 second
- Supported events: item added, item edited, item deleted, item purchased, list updated
- Connection status indicator (online/offline)
- Automatic reconnection on network restore
- Optimistic updates with rollback on conflict

#### FR-5.2: Presence Indicators
**Priority**: Medium
**Story**: As a user, I want to see who else is viewing the list

**Acceptance Criteria**:
- Show avatars of currently online users
- Display user names on hover
- Show "typing" indicator when someone is editing
- Highlight items being edited by others
- Update presence every 30 seconds

#### FR-5.3: Activity Feed
**Priority**: Low
**Story**: As a user, I want to see recent changes to the list

**Acceptance Criteria**:
- Show last 20 activities in sidebar
- Activity types: item added, item purchased, member joined, list updated
- Display relative time (e.g., "2 minutes ago")
- Link to specific items from activity

---

### 3.6 Offline Support

#### FR-6.1: Offline Viewing
**Priority**: High
**Story**: As a user, I want to view my wishlists without internet connection

**Acceptance Criteria**:
- Lists and items cached in IndexedDB
- Offline banner displayed when disconnected
- All read operations work offline
- Service Worker caches static assets
- PWA installable on mobile devices

#### FR-6.2: Offline Editing
**Priority**: High
**Story**: As a user, I want to add/edit items while offline

**Acceptance Criteria**:
- Changes stored locally in IndexedDB
- Changes queued for sync when online
- "Pending sync" badge on modified items
- Automatic sync on reconnection
- Conflict resolution with last-write-wins strategy

---

### 3.7 Search and Filtering

#### FR-7.1: Search Items
**Priority**: Medium
**Story**: As a user, I want to search for specific items across my lists

**Acceptance Criteria**:
- Search by item title, description, or URL
- Search within specific list or across all lists
- Real-time search results (debounced 300ms)
- Highlight matching text in results
- Search works offline on cached data

#### FR-7.2: Filter and Sort
**Priority**: Medium
**Story**: As a user, I want to filter items by status and sort by price

**Acceptance Criteria**:
- Filter by: purchased status, priority level, price range
- Sort by: price (asc/desc), date added, priority, alphabetical
- Multiple filters can be applied simultaneously
- Filter state persists in URL query params

---

## 4. Non-Functional Requirements

### 4.1 Performance

#### NFR-1.1: Page Load Time
**Requirement**: Initial page load < 2 seconds on 3G connection
**Measurement**: Lighthouse Performance Score > 90
**Implementation**:
- Code splitting with Next.js dynamic imports
- Image optimization with next/image
- Lazy loading for below-fold content

#### NFR-1.2: API Response Time
**Requirement**: 95th percentile API response time < 200ms
**Measurement**: Monitor with Vercel Analytics
**Implementation**:
- Database query optimization
- Redis caching for frequent queries
- CDN for static assets

#### NFR-1.3: Real-Time Latency
**Requirement**: Real-time updates propagate within 1 second
**Measurement**: Monitor WebSocket round-trip time
**Implementation**:
- Supabase Realtime with Phoenix Channels
- Optimistic UI updates

### 4.2 Scalability

#### NFR-2.1: Concurrent Users
**Requirement**: Support 10,000 concurrent users
**Measurement**: Load testing with k6
**Implementation**:
- Supabase connection pooling
- Horizontal scaling with Vercel
- Stateless API design

#### NFR-2.2: Data Volume
**Requirement**: Support 1 million lists, 10 million items
**Measurement**: Database performance monitoring
**Implementation**:
- Database indexing on foreign keys
- Pagination for large result sets
- Archival of old lists (> 2 years)

### 4.3 Availability

#### NFR-3.1: Uptime
**Requirement**: 99.9% uptime (< 8.76 hours downtime per year)
**Measurement**: Uptime monitoring with UptimeRobot
**Implementation**:
- Multi-region deployment
- Database replication
- Health check endpoints

#### NFR-3.2: Disaster Recovery
**Requirement**: RPO < 1 hour, RTO < 4 hours
**Measurement**: Backup restoration tests monthly
**Implementation**:
- Automated daily database backups
- Point-in-time recovery enabled
- Disaster recovery playbook

### 4.4 Security

#### NFR-4.1: Authentication
**Requirement**: Multi-factor authentication support
**Measurement**: Security audit
**Implementation**:
- Magic link authentication (primary)
- OAuth 2.0 with Google, Facebook
- JWT tokens with 1-hour expiration
- Refresh tokens with 30-day expiration

#### NFR-4.2: Data Encryption
**Requirement**: All data encrypted in transit and at rest
**Measurement**: Security scan
**Implementation**:
- HTTPS/TLS 1.3 for all connections
- Database encryption with AES-256
- Encrypted S3 buckets for file storage

#### NFR-4.3: Authorization
**Requirement**: Role-based access control (RBAC)
**Measurement**: Penetration testing
**Implementation**:
- Row-level security (RLS) policies in PostgreSQL
- Permission checks on every API request
- No client-side security bypasses

### 4.5 Usability

#### NFR-5.1: Accessibility
**Requirement**: WCAG 2.1 AA compliance
**Measurement**: axe DevTools audit
**Implementation**:
- Semantic HTML
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatibility

#### NFR-5.2: Mobile Responsiveness
**Requirement**: Works on devices from 320px to 2560px width
**Measurement**: Cross-device testing
**Implementation**:
- Mobile-first design with Tailwind CSS
- Touch-friendly UI (48px minimum touch targets)
- Progressive Web App installable on iOS/Android

### 4.6 Maintainability

#### NFR-6.1: Code Quality
**Requirement**: 80% test coverage, 0 critical linting errors
**Measurement**: Jest + ESLint CI checks
**Implementation**:
- TypeScript strict mode
- Unit tests with Jest
- E2E tests with Playwright
- Pre-commit hooks with Husky

#### NFR-6.2: Documentation
**Requirement**: All APIs documented with OpenAPI 3.0
**Measurement**: Documentation coverage report
**Implementation**:
- API reference with Swagger UI
- Component storybook
- Architecture decision records (ADRs)

---

## 5. Technical Architecture

### 5.1 System Architecture

See [Architecture Overview](/docs/architecture/ARCHITECTURE_OVERVIEW.md) for detailed diagrams.

### 5.2 Data Flow

#### 5.2.1 User Adds Item to Wishlist

```
User Action (Add Item)
  ↓
React Component (Optimistic Update)
  ↓
Update UI Immediately
  ↓
Store in IndexedDB (Pending Queue)
  ↓
Next.js API Route (/api/items)
  ↓
Validate Request (Zod Schema)
  ↓
Check Authorization (RLS Policy)
  ↓
Supabase Insert (PostgreSQL)
  ↓
Real-Time Event Broadcast (Supabase Realtime)
  ↓
All Connected Clients Receive Update
  ↓
UI Updates with Server-Confirmed Data
```

#### 5.2.2 URL Parsing Flow

```
User Pastes URL
  ↓
Detect Retailer (Amazon/Target/Walmart/etc)
  ↓
Check Cache (Redis, 7-day TTL)
  ↓
Cache Hit? → Return Cached Data
  ↓ (Cache Miss)
Extract Product ID (ASIN/TCIN/SKU)
  ↓
Fetch Product Page HTML
  ↓
Parse Metadata (Open Graph + Schema.org)
  ↓
Extract: Title, Price, Image, Description
  ↓
Cache Result (Redis + IndexedDB)
  ↓
Return to Frontend
  ↓
Pre-fill Item Form
```

### 5.3 Security Architecture

#### 5.3.1 Authentication Flow

```
User Requests Magic Link
  ↓
Generate Secure Token (crypto.randomUUID)
  ↓
Store Token in Database (15-min expiration)
  ↓
Send Email with Link
  ↓
User Clicks Link
  ↓
Verify Token (Check expiration + unused)
  ↓
Create User Session (JWT)
  ↓
Set HTTP-only Cookie (secure, sameSite)
  ↓
Redirect to Dashboard
```

#### 5.3.2 Authorization with RLS

```
Client Request (Get List Items)
  ↓
Extract JWT from Cookie
  ↓
Verify JWT Signature
  ↓
Set PostgreSQL auth.uid() Context
  ↓
Execute Query with RLS Policy
  ↓
RLS Policy Checks:
  - Is user owner?
  - Is user member with >= viewer role?
  - Is list public?
  ↓
Return Filtered Results
```

---

## 6. Database Schema

### 6.1 Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    users    │         │  locations  │         │    lists    │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id (PK)     │────┐    │ id (PK)     │    ┌────│ id (PK)     │
│ email       │    │    │ name        │    │    │ title       │
│ display_name│    │    │ description │    │    │ description │
│ avatar_url  │    └───>│ owner_id(FK)│    │    │ location_id(FK)
│ created_at  │         │ is_archived │    │    │ owner_id(FK)│
└─────────────┘         │ created_at  │    │    │ year        │
                        └─────────────┘    │    │ is_active   │
                                           │    │ is_public   │
                                           │    │ created_at  │
                                           │    └─────────────┘
                                           │            │
┌─────────────┐         ┌─────────────┐   │    ┌───────▼─────┐
│list_members │         │    items    │   │    │    shares   │
├─────────────┤         ├─────────────┤   │    ├─────────────┤
│ id (PK)     │         │ id (PK)     │   └───>│ id (PK)     │
│ list_id(FK) │───────> │ list_id(FK) │        │ resource_type
│ user_id(FK) │         │ title       │        │ resource_id │
│ permission  │         │ description │        │ shared_with │
│ joined_at   │         │ price       │        │ role        │
└─────────────┘         │ url         │        │ created_at  │
                        │ image_url   │        └─────────────┘
                        │ is_purchased│
                        │ purchased_by│
                        │ priority    │
                        │ created_at  │
                        └─────────────┘
```

### 6.2 Table Definitions

See detailed schema in [Database Schema Documentation](/docs/architecture/database-schema.md).

#### Key Tables

**users**
- Stores user account information
- Linked to Supabase Auth

**locations**
- Represents physical locations (e.g., "Mom's House")
- Has owner and members

**lists**
- Wishlists associated with locations
- Has privacy settings and share links

**items**
- Individual wishlist items
- Tracks purchase status and purchaser

**list_members**
- Junction table for list access
- Defines member roles and permissions

**shares**
- Share links and access tokens
- Supports expiration and usage limits

---

## 7. API Specification

### 7.1 REST API Endpoints

See complete API documentation in [REST API Specification](/docs/architecture/apis/REST_API_SPEC.md).

#### 7.1.1 Authentication Endpoints

```
POST   /api/auth/magic-link        Send magic link to email
POST   /api/auth/verify             Verify magic link token
POST   /api/auth/refresh            Refresh access token
POST   /api/auth/logout             Logout user
```

#### 7.1.2 Location Endpoints

```
GET    /api/locations               List user's locations
POST   /api/locations               Create new location
GET    /api/locations/:id           Get location details
PATCH  /api/locations/:id           Update location
DELETE /api/locations/:id           Delete location
POST   /api/locations/:id/members   Add member to location
DELETE /api/locations/:id/members/:userId   Remove member
```

#### 7.1.3 List Endpoints

```
GET    /api/lists                   List user's wishlists
POST   /api/lists                   Create new wishlist
GET    /api/lists/:id               Get wishlist with items
PATCH  /api/lists/:id               Update wishlist
DELETE /api/lists/:id               Delete wishlist
GET    /api/lists/guest/:token      Access list via guest token
```

#### 7.1.4 Item Endpoints

```
GET    /api/items?list_id=:id       Get items for list
POST   /api/items                   Create item
GET    /api/items/:id               Get item details
PATCH  /api/items/:id               Update item
DELETE /api/items/:id               Delete item
POST   /api/items/:id/purchase      Mark item as purchased
DELETE /api/items/:id/purchase      Unmark item as purchased
POST   /api/items/parse-url         Parse product URL
```

#### 7.1.5 Share Endpoints

```
POST   /api/shares                  Create share link
GET    /api/shares/resource/:type/:id   Get shares for resource
PATCH  /api/shares/:id              Update share settings
DELETE /api/shares/:id              Revoke share access
```

### 7.2 WebSocket Events (Supabase Realtime)

#### 7.2.1 Subscribe to List Updates

```typescript
const channel = supabase
  .channel(`list:${listId}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${listId}` },
    (payload) => {
      // Handle item changes
    }
  )
  .subscribe();
```

#### 7.2.2 Event Types

```typescript
type RealtimeEvent =
  | { event: 'INSERT', table: 'items', new: Item }
  | { event: 'UPDATE', table: 'items', old: Item, new: Item }
  | { event: 'DELETE', table: 'items', old: Item }
  | { event: 'INSERT', table: 'list_members', new: ListMember };
```

---

## 8. User Interface Requirements

### 8.1 Design System

#### 8.1.1 Color Palette

```css
/* Primary Colors */
--color-primary: #c41e3a;      /* Christmas Red */
--color-secondary: #165b33;    /* Christmas Green */
--color-accent: #f4c430;       /* Gold */

/* Neutral Colors */
--color-gray-50: #f9fafb;
--color-gray-900: #111827;

/* Semantic Colors */
--color-success: #10b981;
--color-error: #ef4444;
--color-warning: #f59e0b;
```

#### 8.1.2 Typography

```css
/* Font Family */
--font-sans: Inter, system-ui, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### 8.2 Layout Requirements

#### 8.2.1 Responsive Breakpoints

```
Mobile:  320px - 767px   (1 column)
Tablet:  768px - 1023px  (2 columns)
Desktop: 1024px - 1279px (3 columns)
Large:   1280px+         (4 columns)
```

#### 8.2.2 Component Layout

**Card-Based Item Display**:
- Grid layout with responsive columns
- 16:9 aspect ratio for product images
- Consistent card height per row
- 24px gutter between cards

**Modal Interactions**:
- Full-screen on mobile (< 768px)
- Centered overlay on desktop
- Backdrop with 0.5 opacity
- Escape key to close

### 8.3 Key User Flows

#### 8.3.1 Create First Wishlist

```
1. User lands on dashboard (empty state)
2. Prominent CTA: "Create Your First Wishlist"
3. Modal opens with form:
   - Location selection (or create new)
   - List title (required)
   - Description (optional)
   - Year (default: current year)
4. Click "Create List"
5. Redirect to list detail page
6. Show onboarding tooltip: "Add your first item"
```

#### 8.3.2 Add Item from URL

```
1. User clicks "Add Item" button
2. Modal opens with tabs: "From URL" | "Manual"
3. "From URL" tab active by default
4. User pastes URL into input field
5. System parses URL (loading spinner)
6. Form pre-fills with extracted data:
   - Title (editable)
   - Price (editable)
   - Image (preview shown, can change)
   - Description (editable)
7. User reviews and clicks "Add to List"
8. Item appears in list (optimistic update)
9. Toast notification: "Item added successfully"
```

#### 8.3.3 Mark Item as Purchased

```
1. Shopper views shared wishlist
2. Clicks "Mark as Purchased" on item card
3. Confirmation modal:
   - "Are you sure you want to claim this item?"
   - Preview of item details
   - Optional notes field
4. User clicks "Confirm Purchase"
5. Item status updates to "Purchased"
6. Item disappears from list owner's view
7. Other shoppers see "Claimed" badge
8. Real-time notification to other viewers
```

### 8.4 Accessibility Requirements

#### 8.4.1 Keyboard Navigation
- All interactive elements focusable via Tab
- Modal trap focus within dialog
- Escape key closes modals
- Enter key submits forms

#### 8.4.2 Screen Reader Support
- Semantic HTML elements (header, nav, main, footer)
- ARIA labels on icon-only buttons
- ARIA live regions for toast notifications
- Alt text for all images

#### 8.4.3 Color Contrast
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text (18px+)
- Non-color indicators for status (icons + text)

---

## 9. Security Requirements

### 9.1 Authentication & Authorization

#### SR-1.1: Magic Link Security
- Tokens expire after 15 minutes
- Tokens can only be used once
- Tokens cryptographically secure (UUID v4)
- Rate limit: 5 requests per 15 minutes per email

#### SR-1.2: Session Management
- JWT access tokens expire after 1 hour
- Refresh tokens expire after 30 days
- HTTP-only cookies for token storage
- Secure and SameSite flags enabled

#### SR-1.3: Password Requirements (if implemented)
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character
- Bcrypt hashing with cost factor 12

### 9.2 Data Protection

#### SR-2.1: Encryption
- TLS 1.3 for all connections
- Database encryption at rest (AES-256)
- Encrypted backups

#### SR-2.2: PII Handling
- Email addresses hashed in logs
- No sensitive data in URL parameters
- User IDs anonymized in analytics

### 9.3 API Security

#### SR-3.1: Rate Limiting
- 100 requests per minute per authenticated user
- 20 requests per minute per IP for guest users
- 429 status code when exceeded

#### SR-3.2: Input Validation
- Zod schema validation on all inputs
- SQL injection prevention (parameterized queries)
- XSS prevention (Content Security Policy)
- CSRF tokens on state-changing requests

### 9.4 Infrastructure Security

#### SR-4.1: Environment Variables
- All secrets in environment variables
- No secrets in code repository
- Separate secrets for dev/staging/production

#### SR-4.2: Dependency Management
- Automated security scanning (Dependabot)
- No dependencies with known critical vulnerabilities
- Regular dependency updates

---

## 10. Acceptance Criteria

### 10.1 MVP Release (Phase 1)

**Timeline**: 3-4 weeks

#### AC-1.1: User Authentication
- [ ] User can register with magic link
- [ ] User receives email with login link
- [ ] User can login with Google OAuth
- [ ] User session persists for 30 days
- [ ] User can logout

#### AC-1.2: Location Management
- [ ] User can create location
- [ ] User can invite members via email
- [ ] User can assign roles to members
- [ ] User can view member list

#### AC-1.3: Wishlist Management
- [ ] User can create wishlist with title
- [ ] User can associate wishlist with location
- [ ] User can edit wishlist details
- [ ] User can delete wishlist (with confirmation)
- [ ] User can generate share link

#### AC-1.4: Item Management
- [ ] User can add item manually
- [ ] User can add item from URL (Amazon, Target)
- [ ] User can upload item image
- [ ] User can edit item details
- [ ] User can delete item
- [ ] User can mark item as purchased
- [ ] Purchased items hidden from list owner

#### AC-1.5: Real-Time Collaboration
- [ ] Changes sync to all viewers within 2 seconds
- [ ] Online presence indicators shown
- [ ] Purchase notifications appear in real-time

#### AC-1.6: Performance
- [ ] Lighthouse Performance score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s

### 10.2 Enhanced Features (Phase 2)

**Timeline**: 1-2 weeks after MVP

#### AC-2.1: Offline Support
- [ ] Lists viewable offline
- [ ] Items can be added offline
- [ ] Changes sync on reconnection
- [ ] PWA installable on mobile

#### AC-2.2: Advanced Item Features
- [ ] Item priority levels (high/medium/low)
- [ ] Item categories/tags
- [ ] Price tracking over time
- [ ] Quantity specification

#### AC-2.3: Search and Filtering
- [ ] Search items by title
- [ ] Filter by purchased status
- [ ] Filter by priority
- [ ] Sort by price, date, priority

### 10.3 Definition of Done

A feature is considered "done" when:

1. **Functionality**: All acceptance criteria met
2. **Code Quality**:
   - TypeScript type-safe (no `any` types)
   - ESLint passes with zero errors
   - Test coverage > 80%
3. **Testing**:
   - Unit tests written and passing
   - E2E tests for critical paths
   - Manual QA completed
4. **Documentation**:
   - API endpoints documented
   - Component usage documented
   - README updated
5. **Security**:
   - Security review completed
   - No exposed secrets
   - RLS policies tested
6. **Performance**:
   - Lighthouse audit score > 90
   - No performance regressions
7. **Accessibility**:
   - axe DevTools audit passes
   - Keyboard navigation tested
8. **Deployment**:
   - Deployed to staging
   - Smoke tests pass
   - Ready for production

---

## 11. Open Questions

### 11.1 Product Questions

1. **Multi-year lists**: Should users be able to reuse lists across years, or create new ones annually?
2. **Item comments**: Should family members be able to comment on items (e.g., "I'm interested in this too")?
3. **Budget tracking**: Should we track total wishlist value and purchased value?
4. **Gift ideas**: Should we suggest items based on user preferences or price range?

### 11.2 Technical Questions

1. **Image storage**: Use Supabase Storage or integrate Cloudinary for optimization?
2. **URL parsing**: Implement server-side or client-side (browser extension)?
3. **Conflict resolution**: Last-write-wins or CRDT-based merging?
4. **Analytics**: Plausible (privacy-focused) or Vercel Analytics?

---

## 12. Risks and Mitigation

### 12.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Supabase real-time connection limits | Medium | High | Implement connection pooling, fallback to polling |
| URL parsing failures | High | Medium | Multi-tier fallback strategy, manual entry option |
| Conflict resolution issues | Low | Medium | Implement optimistic locking, clear conflict UI |
| Database performance | Low | High | Index optimization, query caching, pagination |

### 12.2 Product Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Low user adoption | Medium | High | User research, beta testing, iterate on feedback |
| Complex UX for elderly users | High | Medium | Simplified UI mode, QR codes, phone support |
| Privacy concerns | Low | High | Clear privacy policy, opt-in data sharing |

---

## 13. Success Metrics

### 13.1 Launch Metrics (First 3 Months)

- **User Acquisition**: 1,000 registered users
- **Engagement**: 60% of users create at least one list
- **Collaboration**: Average 3 members per location
- **Retention**: 40% 30-day retention rate
- **Performance**: 95th percentile page load < 2s

### 13.2 Quality Metrics

- **Uptime**: 99.5% availability
- **Error Rate**: < 1% API error rate
- **User Satisfaction**: NPS score > 50
- **Support Tickets**: < 5% of users contact support

---

## 14. Appendices

### Appendix A: Glossary

- **ASIN**: Amazon Standard Identification Number
- **CRDT**: Conflict-free Replicated Data Type
- **JWT**: JSON Web Token
- **Open Graph**: Protocol for rich preview metadata
- **PWA**: Progressive Web App
- **RLS**: Row-Level Security
- **TCIN**: Target.com Item Number

### Appendix B: References

- [Research Summary](/docs/RESEARCH-SUMMARY.md)
- [Architecture Overview](/docs/architecture/ARCHITECTURE_OVERVIEW.md)
- [Database Schema](/docs/architecture/database-schema.md)
- [API Specification](/docs/architecture/apis/REST_API_SPEC.md)
- [Wishlist Parsing Research](/docs/wishlist-parsing-research.md)
- [Real-Time Collaboration Patterns](/docs/research/realtime-collaboration-patterns.md)

---

**Document Owner**: Development Team
**Reviewers**: Product Manager, Tech Lead, UX Designer
**Next Review Date**: 2025-01-15
