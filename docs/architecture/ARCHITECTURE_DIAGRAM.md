# System Architecture Diagrams

Visual representations of the Christmas Wishlist application architecture.

---

## System Context Diagram (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM CONTEXT                                   │
└─────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐                                            ┌─────────┐
    │  Family │                                            │  Friend │
    │  Member │                                            │         │
    └────┬────┘                                            └────┬────┘
         │                                                      │
         │  Creates wishlists                                   │  Views
         │  Marks items purchased                               │  shared lists
         │                                                      │
         └──────────────────┬─────────────────────────────────┘
                            │
                            │ HTTPS / Mobile App
                            │
         ┌──────────────────▼──────────────────────────────────┐
         │                                                      │
         │         Christmas Wishlist Application              │
         │                                                      │
         │  - Create & manage wishlists                        │
         │  - Share with family members                        │
         │  - Real-time collaboration                          │
         │  - Purchase tracking                                │
         │                                                      │
         └──────┬───────────────────────┬──────────────────────┘
                │                       │
                │ API calls             │ Email notifications
                │                       │
    ┌───────────▼─────────┐   ┌────────▼──────────┐
    │   Supabase          │   │   Resend          │
    │   (Backend)         │   │   (Email)         │
    │                     │   │                   │
    │ - PostgreSQL        │   │ - Magic links     │
    │ - Auth              │   │ - Purchase alerts │
    │ - Storage           │   │                   │
    │ - Real-time         │   └───────────────────┘
    └─────────────────────┘
```

---

## Container Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONTAINERS                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Browser   │
│   (User)    │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼────────────────────────────────────────────────────────────┐
│                   Web Application (Next.js)                        │
│                                                                    │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐     │
│  │   React UI    │  │  API Routes   │  │  Server Actions  │     │
│  │               │  │               │  │                  │     │
│  │ - Components  │  │ - REST        │  │ - Mutations      │     │
│  │ - Pages       │  │ - Middleware  │  │ - Revalidation   │     │
│  └───────────────┘  └───────────────┘  └──────────────────┘     │
│                                                                    │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         │ Supabase JS SDK
                         │ (REST + WebSocket)
                         │
┌────────────────────────▼───────────────────────────────────────────┐
│                   Supabase Platform                                 │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │   API Gateway    │  │     Auth     │  │      Storage       │  │
│  │   (Kong)         │  │   (GoTrue)   │  │      (S3)          │  │
│  │                  │  │              │  │                    │  │
│  │ - Rate limiting  │  │ - Magic link │  │ - Images           │  │
│  │ - JWT verify     │  │ - OAuth      │  │ - CDN delivery     │  │
│  └──────────────────┘  └──────────────┘  └────────────────────┘  │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │   PostgREST      │  │   Realtime   │  │  Edge Functions    │  │
│  │   (Auto REST)    │  │   (Phoenix)  │  │  (Deno)            │  │
│  │                  │  │              │  │                    │  │
│  │ - CRUD ops       │  │ - WebSocket  │  │ - Metadata extract │  │
│  │ - Auto schema    │  │ - Presence   │  │ - Notifications    │  │
│  └────────┬─────────┘  └──────┬───────┘  └────────────────────┘  │
│           │                   │                                    │
│           │                   │                                    │
│  ┌────────▼───────────────────▼──────────┐                        │
│  │                                        │                        │
│  │      PostgreSQL 15 Database            │                        │
│  │                                        │                        │
│  │  - Tables (users, lists, items)        │                        │
│  │  - Row Level Security (RLS)            │                        │
│  │  - Triggers & Functions                │                        │
│  │  - Full-text Search                    │                        │
│  │                                        │                        │
│  └────────────────────────────────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Diagram (C4 Level 3) - Frontend

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND COMPONENTS                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                     Next.js Application                                 │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    App Router (Pages)                         │     │
│  │                                                                │     │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │     │
│  │  │  Landing   │  │   Login    │  │      Dashboard         │ │     │
│  │  │   Page     │  │   Page     │  │   (Protected Route)    │ │     │
│  │  └────────────┘  └────────────┘  └──────────┬─────────────┘ │     │
│  │                                              │                │     │
│  │                                              │                │     │
│  │  ┌───────────────────────────────────────────┼───────────┐   │     │
│  │  │                                           │           │   │     │
│  │  │  ┌────────────┐  ┌────────────┐  ┌───────▼────────┐ │   │     │
│  │  │  │  Lists     │  │  Locations │  │   Settings     │ │   │     │
│  │  │  │  /lists    │  │ /locations │  │   /settings    │ │   │     │
│  │  │  │            │  │            │  │                │ │   │     │
│  │  │  │  [id]/     │  │            │  │                │ │   │     │
│  │  │  │    page    │  │            │  │                │ │   │     │
│  │  │  └────────────┘  └────────────┘  └────────────────┘ │   │     │
│  │  │                                                       │   │     │
│  │  └───────────────────────────────────────────────────────┘   │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    React Components                           │     │
│  │                                                                │     │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │     │
│  │  │  Layout        │  │   List         │  │   Item         │ │     │
│  │  │                │  │   Components   │  │   Components   │ │     │
│  │  │ - Header       │  │                │  │                │ │     │
│  │  │ - Sidebar      │  │ - ListCard     │  │ - ItemCard     │ │     │
│  │  │ - Footer       │  │ - ListForm     │  │ - ItemForm     │ │     │
│  │  │                │  │ - ListFilters  │  │ - ItemGrid     │ │     │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │     │
│  │                                                                │     │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │     │
│  │  │  Sharing       │  │   Common       │  │   UI Library   │ │     │
│  │  │  Components    │  │   Components   │  │   (shadcn/ui)  │ │     │
│  │  │                │  │                │  │                │ │     │
│  │  │ - ShareDialog  │  │ - Loading      │  │ - Button       │ │     │
│  │  │ - ShareLink    │  │ - ErrorBound   │  │ - Input        │ │     │
│  │  │ - PermSelect   │  │ - Toast        │  │ - Dialog       │ │     │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    State Management                           │     │
│  │                                                                │     │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │     │
│  │  │  React Query   │  │   Zustand      │  │   React Hook   │ │     │
│  │  │                │  │                │  │   Form         │ │     │
│  │  │ - Server state │  │ - Client state │  │                │ │     │
│  │  │ - Caching      │  │ - UI state     │  │ - Form state   │ │     │
│  │  │ - Optimistic   │  │ - Preferences  │  │ - Validation   │ │     │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    Custom Hooks                               │     │
│  │                                                                │     │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────┐ │     │
│  │  │  useAuth   │  │  useList   │  │  useItems  │  │useReal │ │     │
│  │  │            │  │            │  │            │  │ time   │ │     │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────┘ │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    Utility Libraries                          │     │
│  │                                                                │     │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────┐ │     │
│  │  │  Supabase  │  │  Auth      │  │  Storage   │  │ Utils  │ │     │
│  │  │  Client    │  │  Helpers   │  │  Helpers   │  │        │ │     │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────┘ │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram - Adding an Item

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW: ADD ITEM                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Fills form & clicks "Add Item"
     │
┌────▼──────────────────────────────────────────────────────────┐
│                    ItemForm Component                          │
│                                                                │
│  - React Hook Form captures data                              │
│  - Client-side validation                                     │
│                                                                │
└────┬──────────────────────────────────────────────────────────┘
     │
     │ 2. Triggers mutation
     │
┌────▼──────────────────────────────────────────────────────────┐
│                    React Query Mutation                        │
│                                                                │
│  - onMutate: Optimistic update (add temp item to UI)          │
│  - mutationFn: Call Supabase insert                           │
│                                                                │
└────┬──────────────────────────────────────────────────────────┘
     │
     │ 3. Optimistic UI update (instant feedback)
     │
┌────▼──────────────────────────────────────────────────────────┐
│                    UI Updates                                  │
│                                                                │
│  - New item appears in list immediately                       │
│  - "Saving..." indicator shown                                │
│  - User can continue working                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    Supabase Client                             │
│                                                                │
│  POST /rest/v1/items                                          │
│  Authorization: Bearer <JWT>                                  │
│  Body: { list_id, title, price, ... }                        │
│                                                                │
└────┬──────────────────────────────────────────────────────────┘
     │
     │ 4. API request sent
     │
┌────▼──────────────────────────────────────────────────────────┐
│                    Supabase API Gateway                        │
│                                                                │
│  - Verify JWT signature                                       │
│  - Extract user ID from token                                 │
│  - Check rate limits                                          │
│                                                                │
└────┬──────────────────────────────────────────────────────────┘
     │
     │ 5. Validated request
     │
┌────▼──────────────────────────────────────────────────────────┐
│                    PostgREST                                   │
│                                                                │
│  - Transform REST to SQL                                      │
│  - Apply Row Level Security context                           │
│                                                                │
└────┬──────────────────────────────────────────────────────────┘
     │
     │ 6. SQL query
     │
┌────▼──────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                         │
│                                                                │
│  INSERT INTO items (list_id, title, price, created_by, ...)  │
│  VALUES ($1, $2, $3, $4, ...)                                 │
│  RETURNING *;                                                 │
│                                                                │
│  - Check RLS policies (can user insert to this list?)        │
│  - Execute insert                                             │
│  - Fire triggers (update list.updated_at)                    │
│  - Return inserted row                                        │
│                                                                │
└────┬──────────────────────────────────────────────────────────┘
     │
     │ 7. Database change event
     │
┌────▼──────────────────────────────────────────────────────────┐
│                    PostgreSQL Replication                      │
│                                                                │
│  - Logical replication captures INSERT                        │
│  - Publishes change to replication slot                       │
│                                                                │
└────┬──────────────────────────────────────────────────────────┘
     │
     │ 8. Change stream
     │
┌────▼──────────────────────────────────────────────────────────┐
│                    Supabase Realtime Server                    │
│                                                                │
│  - Receives database change                                   │
│  - Applies RLS to change event                                │
│  - Broadcasts to subscribed clients via WebSocket             │
│                                                                │
└────┬──────────────────────────────────────────────────────────┘
     │
     │ 9. WebSocket broadcast
     │
     ├───────────────────────┬────────────────────────────────────┐
     │                       │                                    │
     │                       │                                    │
┌────▼────────┐      ┌──────▼───────┐                  ┌────────▼────────┐
│  Client 1   │      │   Client 2   │                  │   Client N      │
│  (Original) │      │   (Viewer)   │                  │   (Viewer)      │
│             │      │              │                  │                 │
│ - Confirm   │      │ - Add new    │                  │ - Add new       │
│   optimistic│      │   item to UI │                  │   item to UI    │
│   update    │      │              │                  │                 │
│             │      │              │                  │                 │
└─────────────┘      └──────────────┘                  └─────────────────┘
```

---

## Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Network Security (Cloudflare)                                  │
│                                                                          │
│  ✓ DDoS protection (L3/L4/L7)                                           │
│  ✓ WAF (Web Application Firewall)                                       │
│  ✓ Rate limiting (100 req/min per IP)                                   │
│  ✓ Bot protection                                                        │
│  ✓ TLS 1.3 encryption                                                    │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ HTTPS
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│ Layer 2: Application Security (Next.js)                                  │
│                                                                          │
│  ✓ Content Security Policy (CSP)                                        │
│  ✓ CSRF protection (SameSite cookies)                                   │
│  ✓ XSS protection (input sanitization)                                  │
│  ✓ Security headers (X-Frame-Options, etc.)                             │
│  ✓ Input validation (Zod schemas)                                       │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ API Calls
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│ Layer 3: API Gateway Security (Kong)                                     │
│                                                                          │
│  ✓ API key validation                                                   │
│  ✓ JWT token verification (RS256)                                       │
│  ✓ Request validation                                                   │
│  ✓ Rate limiting per user                                               │
│  ✓ Request/response logging                                             │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ Validated Requests
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│ Layer 4: Authentication (GoTrue)                                         │
│                                                                          │
│  ✓ Magic link authentication (passwordless)                             │
│  ✓ OAuth 2.0 (Google, Facebook, Apple)                                  │
│  ✓ JWT token generation                                                 │
│  ✓ Refresh token rotation                                               │
│  ✓ Session management                                                   │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ Authenticated User
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│ Layer 5: Authorization (Row Level Security)                              │
│                                                                          │
│  PostgreSQL RLS Policies:                                               │
│                                                                          │
│  CREATE POLICY "Users can read accessible lists"                        │
│    ON lists FOR SELECT                                                  │
│    USING (                                                              │
│      owner_id = auth.uid()                                              │
│      OR id IN (                                                         │
│        SELECT resource_id FROM shares                                   │
│        WHERE shared_with = auth.uid()                                   │
│      )                                                                  │
│    );                                                                   │
│                                                                          │
│  ✓ Row-level data isolation                                             │
│  ✓ Policy-based access control                                          │
│  ✓ Automatic enforcement                                                │
│  ✓ Audit logging                                                        │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ Authorized Data
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│ Layer 6: Data Security (Encryption)                                      │
│                                                                          │
│  ✓ Encryption at rest (AES-256)                                         │
│  ✓ Encryption in transit (TLS 1.3)                                      │
│  ✓ Encrypted backups                                                    │
│  ✓ Secure key management                                                │
│                                                                          │
└───────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    THREAT MITIGATION                                     │
└─────────────────────────────────────────────────────────────────────────┘

Threat: SQL Injection
  ✓ Mitigation: Parameterized queries (PostgREST)
  ✓ Mitigation: ORM (Supabase client)
  ✓ Mitigation: Input validation

Threat: XSS (Cross-Site Scripting)
  ✓ Mitigation: React automatic escaping
  ✓ Mitigation: Content Security Policy
  ✓ Mitigation: DOMPurify for HTML sanitization

Threat: CSRF (Cross-Site Request Forgery)
  ✓ Mitigation: SameSite cookies
  ✓ Mitigation: JWT tokens (not cookies for auth)
  ✓ Mitigation: CSRF tokens on sensitive actions

Threat: Unauthorized Access
  ✓ Mitigation: Row Level Security (RLS)
  ✓ Mitigation: JWT authentication
  ✓ Mitigation: Resource-level permissions

Threat: Data Breach
  ✓ Mitigation: Encryption at rest (AES-256)
  ✓ Mitigation: Encryption in transit (TLS 1.3)
  ✓ Mitigation: Regular security audits
  ✓ Mitigation: Principle of least privilege

Threat: DDoS Attack
  ✓ Mitigation: Cloudflare protection
  ✓ Mitigation: Rate limiting
  ✓ Mitigation: Auto-scaling

Threat: Session Hijacking
  ✓ Mitigation: Secure cookies (HttpOnly, Secure, SameSite)
  ✓ Mitigation: Short-lived JWT tokens (15 min)
  ✓ Mitigation: Refresh token rotation
```

---

## Deployment Pipeline Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  Developer   │
│  Workstation │
└──────┬───────┘
       │
       │ git push
       │
┌──────▼───────────────────────────────────────────────────────────────┐
│                         GitHub Repository                             │
│                                                                       │
│  - Code in version control                                           │
│  - Pull request created                                              │
│                                                                       │
└──────┬───────────────────────────────────────────────────────────────┘
       │
       │ Webhook trigger
       │
┌──────▼───────────────────────────────────────────────────────────────┐
│                      GitHub Actions (CI)                              │
│                                                                       │
│  Step 1: Checkout Code                                              │
│    actions/checkout@v3                                              │
│                                                                       │
│  Step 2: Install Dependencies                                        │
│    npm ci                                                            │
│                                                                       │
│  Step 3: Type Check                                                  │
│    npm run typecheck                                                 │
│    ✓ Check TypeScript types                                          │
│                                                                       │
│  Step 4: Lint                                                        │
│    npm run lint                                                      │
│    ✓ Check code style (ESLint)                                       │
│    ✓ Check formatting (Prettier)                                     │
│                                                                       │
│  Step 5: Run Tests                                                   │
│    npm run test                                                      │
│    ✓ Unit tests (Vitest)                                             │
│    ✓ Integration tests                                               │
│                                                                       │
│  Step 6: Build Application                                           │
│    npm run build                                                     │
│    ✓ Next.js production build                                        │
│    ✓ Verify no build errors                                          │
│                                                                       │
│  Step 7: E2E Tests (Playwright)                                      │
│    npm run test:e2e                                                  │
│    ✓ Test critical user flows                                        │
│                                                                       │
└──────┬───────────────────────────────────────────────────────────────┘
       │
       │ All checks passed
       │
       ├───────────────────┬────────────────────────────────────────────┐
       │                   │                                            │
       │ PR to main        │ PR to develop                             │ Merge to main
       │                   │                                            │
┌──────▼─────────┐  ┌──────▼────────┐                        ┌────────▼───────┐
│  Preview       │  │   Staging     │                        │   Production   │
│  Deployment    │  │   Deployment  │                        │   Deployment   │
│  (Vercel)      │  │   (Vercel)    │                        │   (Vercel)     │
│                │  │               │                        │                │
│ - Unique URL   │  │ - staging.app │                        │ - wishlist.app │
│ - PR comments  │  │ - Test env    │                        │ - Blue/green   │
│ - Auto cleanup │  │ - Integration │                        │ - Rollback     │
│                │  │               │                        │                │
└────────────────┘  └───────────────┘                        └────────┬───────┘
                                                                      │
                                                                      │
                                                          ┌───────────▼────────┐
                                                          │   Post-Deploy      │
                                                          │                    │
                                                          │ - Smoke tests      │
                                                          │ - Sentry monitor   │
                                                          │ - Performance      │
                                                          │   metrics          │
                                                          │                    │
                                                          └────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ENVIRONMENTS                               │
└─────────────────────────────────────────────────────────────────────────┘

Development:
  - Local machine
  - localhost:3000
  - Supabase local (Docker)
  - Hot reload enabled
  - Debug mode

Preview (Pull Requests):
  - Unique URL per PR
  - https://pr-123-xmaslist.vercel.app
  - Supabase staging
  - Automatically created
  - Automatically cleaned up after merge

Staging:
  - https://staging.wishlist.app
  - Supabase staging instance
  - Integration testing
  - QA environment
  - Mirrors production config

Production:
  - https://wishlist.app
  - Supabase production
  - Global CDN
  - Auto-scaling
  - Monitoring & alerts
  - Rollback capability
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-02
**Maintained By:** Architecture Team
