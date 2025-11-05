# Architecture Diagrams - Christmas Wishlist Application

## Table of Contents
1. [C4 Model Diagrams](#c4-model-diagrams)
2. [Data Flow Diagrams](#data-flow-diagrams)
3. [Sequence Diagrams](#sequence-diagrams)
4. [Deployment Diagrams](#deployment-diagrams)

---

## C4 Model Diagrams

### Level 1: System Context Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                      Christmas Wishlist System                   │
│                                                                  │
│  Allows users to create, share, and manage holiday wishlists    │
│  across multiple locations with collaborative features           │
│                                                                  │
└────────────────┬──────────────────────────┬─────────────────────┘
                 │                          │
                 │                          │
        ┌────────▼────────┐        ┌────────▼────────┐
        │                 │        │                 │
        │  Web/Mobile     │        │   Guest Users   │
        │  Users          │        │                 │
        │                 │        │ (View-only)     │
        └────────┬────────┘        └────────┬────────┘
                 │                          │
                 └──────────┬───────────────┘
                            │
                ┌───────────▼───────────┐
                │  Email Service        │
                │  (SendGrid/AWS SES)   │
                └───────────────────────┘

External Systems:
- Authentication Provider (Clerk/Auth0/Firebase)
- Storage Provider (AWS S3/Cloudinary)
- Payment Gateway (Stripe) [Future]
```

---

### Level 2: Container Diagram (Option 3 - Node.js + AWS)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Users & Browsers                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
                       │
        ┌──────────────▼──────────────┐
        │  AWS CloudFront CDN         │
        │  (Static Assets + Images)   │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────┐
        │  Next.js Frontend       │
        │  (React SPA)            │
        │  - Vercel/AWS Amplify   │
        └──────────┬──────────────┘
                   │ REST/GraphQL/WS
                   │
        ┌──────────▼──────────────────────────────────┐
        │  Application Load Balancer (AWS ALB)        │
        └──────────┬──────────────────────────────────┘
                   │
        ┌──────────▼──────────────────────────────────┐
        │  Node.js API Servers (AWS ECS/Fargate)      │
        │  - Express + TypeScript                     │
        │  - GraphQL (Apollo Server)                  │
        │  - WebSocket (Socket.io)                    │
        │  - JWT Auth Middleware                      │
        └──────┬────────────┬──────────┬──────────────┘
               │            │          │
               │            │          │
    ┌──────────▼────┐  ┌───▼────┐  ┌─▼──────────┐
    │  PostgreSQL   │  │ Redis  │  │  AWS SQS   │
    │  (RDS)        │  │ Cache  │  │  Queue     │
    │               │  │        │  │            │
    │ - Primary     │  │ - User │  │ - Email    │
    │ - Read Replica│  │   Sess │  │ - Images   │
    └───────────────┘  └────────┘  └─────┬──────┘
                                          │
                                   ┌──────▼──────┐
                                   │  Lambda     │
                                   │  Workers    │
                                   └──────┬──────┘
                                          │
                              ┌───────────▼───────────┐
                              │  AWS S3 Storage       │
                              │  (User avatars,       │
                              │   Product images)     │
                              └───────────────────────┘
```

---

### Level 3: Component Diagram (Backend API)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Node.js API Server                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  HTTP/WebSocket Layer                     │  │
│  │  - Express Router                                         │  │
│  │  - GraphQL Resolver                                       │  │
│  │  - WebSocket Handler                                      │  │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                               │
│  ┌──────────────▼───────────────────────────────────────────┐  │
│  │                  Middleware Layer                         │  │
│  │  - Authentication (JWT Verification)                      │  │
│  │  - Authorization (Role-based Access)                      │  │
│  │  - Request Validation (Joi/Zod)                           │  │
│  │  - Rate Limiting (Redis)                                  │  │
│  │  - Error Handling                                         │  │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                               │
│  ┌──────────────▼───────────────────────────────────────────┐  │
│  │                  Service Layer                            │  │
│  │                                                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │  Auth    │ │  User    │ │Location  │ │  List    │   │  │
│  │  │  Service │ │  Service │ │ Service  │ │  Service │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │  Item    │ │  Share   │ │  Search  │ │  Upload  │   │  │
│  │  │  Service │ │  Service │ │  Service │ │  Service │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                               │
│  ┌──────────────▼───────────────────────────────────────────┐  │
│  │                  Repository Layer                         │  │
│  │  - Database Queries (TypeORM/Prisma)                      │  │
│  │  - Transaction Management                                 │  │
│  │  - Query Optimization                                     │  │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                               │
│  ┌──────────────▼───────────────────────────────────────────┐  │
│  │                  External Services                        │  │
│  │  - Email Client (SendGrid)                                │  │
│  │  - Storage Client (AWS S3)                                │  │
│  │  - Cache Client (Redis)                                   │  │
│  │  - Queue Client (AWS SQS)                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### User Registration Flow

```
┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐
│ Client  │        │   API   │        │Database │        │  Email  │
└────┬────┘        └────┬────┘        └────┬────┘        └────┬────┘
     │                  │                  │                  │
     │  POST /register  │                  │                  │
     ├─────────────────>│                  │                  │
     │                  │                  │                  │
     │                  │ Validate data    │                  │
     │                  │ Hash password    │                  │
     │                  │                  │                  │
     │                  │  INSERT user     │                  │
     │                  ├─────────────────>│                  │
     │                  │                  │                  │
     │                  │<─────────────────┤                  │
     │                  │  User created    │                  │
     │                  │                  │                  │
     │                  │  Generate tokens │                  │
     │                  │                  │                  │
     │                  │  Send verification email           │
     │                  ├────────────────────────────────────>│
     │                  │                  │                  │
     │<─────────────────┤                  │                  │
     │  User + Tokens   │                  │                  │
     │                  │                  │                  │
     │                  │                  │   Email sent     │
     │<─────────────────────────────────────────────────────┤
     │                  │                  │                  │
```

---

### Item Purchase Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ User A  │     │   API   │     │Database │     │  WS     │
│(Buyer)  │     │         │     │         │     │ Server  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ POST /items/  │               │               │
     │ :id/purchase  │               │               │
     ├──────────────>│               │               │
     │               │               │               │
     │               │  Verify access│               │
     │               │  permissions  │               │
     │               │               │               │
     │               │  BEGIN TRANS  │               │
     │               ├──────────────>│               │
     │               │               │               │
     │               │  Check item   │               │
     │               │  not purchased│               │
     │               │<──────────────┤               │
     │               │               │               │
     │               │  UPDATE item  │               │
     │               │  SET purchased│               │
     │               ├──────────────>│               │
     │               │               │               │
     │               │  INSERT       │               │
     │               │  activity_log │               │
     │               ├──────────────>│               │
     │               │               │               │
     │               │  COMMIT       │               │
     │               ├──────────────>│               │
     │               │               │               │
     │<──────────────┤               │               │
     │  Success      │               │               │
     │               │               │               │
     │               │  Broadcast update             │
     │               ├──────────────────────────────>│
     │               │               │               │
     │               │               │   Push to    │
     │               │               │   User B     │
     │               │               │  (list owner)│
     │               │               │               │
```

---

### Share List Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Owner   │     │   API   │     │Database │     │  Email  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ POST /shares  │               │               │
     ├──────────────>│               │               │
     │               │               │               │
     │               │  Verify owner │               │
     │               │  permissions  │               │
     │               │               │               │
     │               │  Look up user │               │
     │               │  by email     │               │
     │               ├──────────────>│               │
     │               │<──────────────┤               │
     │               │  User found   │               │
     │               │               │               │
     │               │  INSERT share │               │
     │               ├──────────────>│               │
     │               │<──────────────┤               │
     │               │               │               │
     │<──────────────┤               │               │
     │  Share created│               │               │
     │               │               │               │
     │               │  Send notification            │
     │               ├──────────────────────────────>│
     │               │               │               │
```

---

## Sequence Diagrams

### Authentication Flow (OAuth + JWT)

```
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│Browser │   │Frontend│   │  API   │   │ Clerk  │   │Database│
└───┬────┘   └───┬────┘   └───┬────┘   └───┬────┘   └───┬────┘
    │            │            │            │            │
    │ Click Login│            │            │            │
    ├───────────>│            │            │            │
    │            │            │            │            │
    │            │ Redirect to Clerk       │            │
    │            ├────────────────────────>│            │
    │            │            │            │            │
    │<───────────────────────────────────┤            │
    │  OAuth Login Page     │            │            │
    │            │            │            │            │
    │ Enter credentials      │            │            │
    ├────────────────────────────────────>│            │
    │            │            │            │            │
    │<───────────────────────────────────┤            │
    │  Auth code │            │            │            │
    │            │            │            │            │
    │  Redirect with code    │            │            │
    ├───────────>│            │            │            │
    │            │            │            │            │
    │            │ POST /auth/callback    │            │
    │            │    (auth_code)          │            │
    │            ├───────────>│            │            │
    │            │            │            │            │
    │            │            │ Verify code│            │
    │            │            ├───────────>│            │
    │            │            │<───────────┤            │
    │            │            │  User info │            │
    │            │            │            │            │
    │            │            │  Get/Create user        │
    │            │            ├────────────────────────>│
    │            │            │<────────────────────────┤
    │            │            │            │            │
    │            │            │  Generate JWT           │
    │            │            │  (access + refresh)     │
    │            │            │            │            │
    │            │<───────────┤            │            │
    │            │  Tokens    │            │            │
    │<───────────┤            │            │            │
    │  Store tokens          │            │            │
    │            │            │            │            │
```

---

### Real-time List Updates (WebSocket)

```
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│ User A │   │   WS   │   │  API   │   │Database│
└───┬────┘   └───┬────┘   └───┬────┘   └───┬────┘
    │            │            │            │
    │ Connect WS │            │            │
    ├───────────>│            │            │
    │            │            │            │
    │ Subscribe  │            │            │
    │ to list:id │            │            │
    ├───────────>│            │            │
    │            │            │            │
    │            │ Register   │            │
    │            │ subscriber │            │
    │            │            │            │
    │<───────────┤            │            │
    │  Subscribed│            │            │
    │            │            │            │

    User B creates new item:

┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│ User B │   │  API   │   │Database│   │   WS   │
└───┬────┘   └───┬────┘   └───┬────┘   └───┬────┘
    │            │            │            │
    │ POST /items│            │            │
    ├───────────>│            │            │
    │            │            │            │
    │            │ INSERT item│            │
    │            ├───────────>│            │
    │            │<───────────┤            │
    │            │            │            │
    │<───────────┤            │            │
    │  Item created          │            │
    │            │            │            │
    │            │  Publish event          │
    │            ├────────────────────────>│
    │            │            │            │
                                           │
    Back to User A:                        │
                                           │
┌────────┐                                 │
│ User A │                                 │
└───┬────┘                                 │
    │                                      │
    │  Push item_created event             │
    │<─────────────────────────────────────┤
    │                                      │
    │  Update UI                           │
    │                                      │
```

---

## Deployment Diagrams

### Option 1: Firebase Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                       Google Cloud Platform                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Firebase Hosting (CDN)                   │  │
│  │  - Static site (React SPA)                            │  │
│  │  - Automatic HTTPS                                    │  │
│  │  - Global CDN                                         │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │              Firebase Services                        │  │
│  │                                                        │  │
│  │  ┌───────────────────────────────────────────────┐   │  │
│  │  │  Cloud Firestore (NoSQL Database)            │   │  │
│  │  │  - Multi-region replication                   │   │  │
│  │  │  - Automatic scaling                          │   │  │
│  │  └───────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │  ┌───────────────────────────────────────────────┐   │  │
│  │  │  Firebase Authentication                      │   │  │
│  │  │  - Email/Password, OAuth                      │   │  │
│  │  └───────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │  ┌───────────────────────────────────────────────┐   │  │
│  │  │  Cloud Storage for Firebase                   │   │  │
│  │  │  - User avatars, product images               │   │  │
│  │  └───────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │  ┌───────────────────────────────────────────────┐   │  │
│  │  │  Cloud Functions                              │   │  │
│  │  │  - Server-side business logic                 │   │  │
│  │  │  - Email notifications (via SendGrid)         │   │  │
│  │  └───────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

Regions: us-central1 (primary), europe-west1 (optional)
```

---

### Option 2: Supabase + Vercel Deployment

```
┌──────────────────────────────────────────────────────────────┐
│                          Vercel Edge Network                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (SSR + Static)                     │   │
│  │  - Global CDN (150+ locations)                       │   │
│  │  - Automatic HTTPS                                   │   │
│  │  - Edge Functions                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                      Supabase Cloud                           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database (AWS RDS)                       │   │
│  │  - Primary in us-east-1                              │   │
│  │  - Read replicas (optional)                          │   │
│  │  - Automatic backups                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgREST API (Auto-generated)                      │   │
│  │  - REST endpoints from SQL schema                    │   │
│  │  - Row Level Security enforcement                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Supabase Auth (GoTrue)                              │   │
│  │  - JWT token generation                              │   │
│  │  - OAuth providers                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Supabase Storage (AWS S3)                           │   │
│  │  - Images, avatars                                   │   │
│  │  - CDN integration                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Supabase Realtime (WebSockets)                      │   │
│  │  - PostgreSQL change streams                         │   │
│  │  - Broadcast channels                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Edge Functions (Deno runtime)                       │   │
│  │  - Custom business logic                             │   │
│  │  - Webhooks                                          │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘

Regions: us-east-1 (primary), eu-west-1 (optional)
```

---

### Option 3: AWS Full Stack Deployment

```
┌──────────────────────────────────────────────────────────────┐
│                      AWS Cloud Infrastructure                 │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Route 53 (DNS)                                      │   │
│  │  - wishlist.app                                      │   │
│  │  - api.wishlist.app                                  │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │  CloudFront CDN                                      │   │
│  │  - Global edge locations                             │   │
│  │  - SSL/TLS certificates (ACM)                        │   │
│  │  - Cache static assets                               │   │
│  └────┬──────────────────────────────────┬──────────────┘   │
│       │                                  │                   │
│  ┌────▼─────────────────┐     ┌─────────▼─────────────┐    │
│  │  S3 Bucket            │     │  Application Load     │    │
│  │  (Frontend static)    │     │  Balancer             │    │
│  │  - React build        │     │  - HTTPS termination  │    │
│  └──────────────────────┘     └─────────┬─────────────┘    │
│                                          │                   │
│                         ┌────────────────▼────────────┐     │
│                         │  ECS Fargate Cluster        │     │
│                         │  (Docker containers)        │     │
│                         │                             │     │
│  ┌──────────────────────┼─────────────────────────────┼──┐ │
│  │  Task Definition     │  ┌─────────────────────┐   │  │ │
│  │                      │  │  Node.js API        │   │  │ │
│  │  ┌─────────────┐    │  │  (Express + TS)     │   │  │ │
│  │  │ API Server  │    │  └─────────────────────┘   │  │ │
│  │  │  (3 tasks)  │    │                             │  │ │
│  │  │             │    │  ┌─────────────────────┐   │  │ │
│  │  │ Auto-scaling│◄───┼──┤  Health checks      │   │  │ │
│  │  │  CPU 70%    │    │  │  /health endpoint   │   │  │ │
│  │  └─────────────┘    │  └─────────────────────┘   │  │ │
│  └──────────────────────┴─────────────────────────────┴──┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  RDS PostgreSQL                                      │   │
│  │  ┌────────────────┐          ┌────────────────┐     │   │
│  │  │  Primary       │          │  Read Replica  │     │   │
│  │  │  (us-east-1a)  │◄────────►│  (us-east-1b)  │     │   │
│  │  │  db.t3.medium  │  Async   │  db.t3.medium  │     │   │
│  │  └────────────────┘  Replica └────────────────┘     │   │
│  │                                                       │   │
│  │  - Automated backups (7 days)                        │   │
│  │  - Multi-AZ deployment                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ElastiCache (Redis)                                 │   │
│  │  - Session storage                                   │   │
│  │  - Query caching                                     │   │
│  │  - cache.t3.micro cluster                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  S3 Buckets                                          │   │
│  │  - user-avatars (private)                            │   │
│  │  - product-images (public-read)                      │   │
│  │  - Lifecycle policies (archive old files)           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SQS Queues                                          │   │
│  │  - email-notifications                               │   │
│  │  - image-processing                                  │   │
│  │  - Dead letter queues                                │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │  Lambda Functions                                    │   │
│  │  - Email sender (Node.js 18)                         │   │
│  │  - Image resizer (Node.js 18 + Sharp)               │   │
│  │  - Scheduled cleanups                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CloudWatch                                          │   │
│  │  - Application logs                                  │   │
│  │  - Metrics & alarms                                  │   │
│  │  - Dashboard                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Secrets Manager                                     │   │
│  │  - Database credentials                              │   │
│  │  - API keys (SendGrid, Clerk, etc.)                  │   │
│  │  - Automatic rotation                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  VPC Configuration                                   │   │
│  │  - Public subnets (ALB, NAT Gateway)                 │   │
│  │  - Private subnets (ECS, RDS, ElastiCache)           │   │
│  │  - Security groups & NACLs                           │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘

External Services:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Clerk     │  │   SendGrid   │  │   Datadog    │
│    Auth      │  │    Email     │  │  Monitoring  │
└──────────────┘  └──────────────┘  └──────────────┘

Deployment Regions:
- Primary: us-east-1 (N. Virginia)
- Secondary: us-west-2 (Oregon) [Optional DR]
```

---

## Infrastructure as Code (Terraform Example)

```hcl
# Example Terraform configuration for AWS deployment

# VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true

  tags = {
    Name = "wishlist-vpc"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "api" {
  name = "wishlist-api-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier           = "wishlist-db"
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.t3.medium"
  allocated_storage   = 100
  storage_encrypted   = true

  db_name  = "wishlist"
  username = "admin"
  password = data.aws_secretsmanager_secret_version.db_password.secret_string

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  multi_az               = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "wishlist-db-final-snapshot"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "wishlist-database"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "wishlist-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379

  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}

# S3 Buckets
resource "aws_s3_bucket" "images" {
  bucket = "wishlist-product-images"

  tags = {
    Name = "wishlist-images"
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Wishlist CDN"
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-Frontend"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
  }
}
```

---

## CI/CD Pipeline Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       GitHub Repository                          │
│  - feature/*, develop, main branches                             │
└────────────────────┬────────────────────────────────────────────┘
                     │ Push/PR
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    GitHub Actions Workflow                       │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Stage 1: Code Quality                                    │ │
│  │  - Lint (ESLint)                                          │ │
│  │  - Format check (Prettier)                                │ │
│  │  - Type check (TypeScript)                                │ │
│  │  - Security scan (Snyk)                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                     │                                            │
│  ┌──────────────────▼────────────────────────────────────────┐ │
│  │  Stage 2: Build & Test                                    │ │
│  │  - Install dependencies (npm ci)                          │ │
│  │  - Build application (npm run build)                      │ │
│  │  - Run unit tests (Jest)                                  │ │
│  │  - Run integration tests                                  │ │
│  │  - Generate coverage report                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                     │                                            │
│  ┌──────────────────▼────────────────────────────────────────┐ │
│  │  Stage 3: Build Docker Image                              │ │
│  │  - docker build -t api:${SHA}                             │ │
│  │  - Push to ECR                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                     │                                            │
│  ┌──────────────────▼────────────────────────────────────────┐ │
│  │  Stage 4: Deploy to Staging (develop branch)              │ │
│  │  - Update ECS task definition                             │ │
│  │  - Deploy to staging cluster                              │ │
│  │  - Run smoke tests                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                     │                                            │
│  ┌──────────────────▼────────────────────────────────────────┐ │
│  │  Stage 5: E2E Tests (Playwright)                          │ │
│  │  - Run full test suite against staging                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                     │                                            │
│  ┌──────────────────▼────────────────────────────────────────┐ │
│  │  Stage 6: Deploy to Production (main branch)              │ │
│  │  - Manual approval required                               │ │
│  │  - Blue-green deployment                                  │ │
│  │  - Health checks                                          │ │
│  │  - Automatic rollback on failure                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                     │                                            │
│  ┌──────────────────▼────────────────────────────────────────┐ │
│  │  Stage 7: Post-Deploy                                     │ │
│  │  - Database migrations (if any)                           │ │
│  │  - Clear CDN cache                                        │ │
│  │  - Send Slack notification                                │ │
│  │  - Create deployment tag                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

Environments:
- Development: Auto-deploy on feature branch push
- Staging: Auto-deploy on develop branch merge
- Production: Manual approval + main branch merge
```

---

## Security Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Security Layers                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Layer 1: Network Security                                 │ │
│  │  - WAF (Web Application Firewall)                          │ │
│  │  - DDoS protection (CloudFlare/AWS Shield)                 │ │
│  │  - Rate limiting at edge                                   │ │
│  │  - IP whitelisting (optional)                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                     │                                            │
│  ┌──────────────────▼────────────────────────────────────────┐ │
│  │  Layer 2: Application Security                             │ │
│  │  - HTTPS/TLS 1.3 only                                      │ │
│  │  - CORS policy enforcement                                 │ │
│  │  - Security headers (HSTS, CSP, X-Frame-Options)           │ │
│  │  - Request validation & sanitization                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                     │                                            │
│  ┌──────────────────▼────────────────────────────────────────┐ │
│  │  Layer 3: Authentication & Authorization                   │ │
│  │  - JWT token validation                                    │ │
│  │  - Role-based access control (RBAC)                        │ │
│  │  - Session management                                      │ │
│  │  - OAuth 2.0 / OIDC                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                     │                                            │
│  ┌──────────────────▼────────────────────────────────────────┐ │
│  │  Layer 4: Data Security                                    │ │
│  │  - Database encryption at rest (AES-256)                   │ │
│  │  - Encryption in transit (TLS)                             │ │
│  │  - Row Level Security (RLS)                                │ │
│  │  - Sensitive data masking in logs                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                     │                                            │
│  ┌──────────────────▼────────────────────────────────────────┐ │
│  │  Layer 5: Monitoring & Auditing                            │ │
│  │  - Security event logging                                  │ │
│  │  - Anomaly detection                                       │ │
│  │  - Audit trail                                             │ │
│  │  - Alerting on suspicious activity                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘

Data Flow with Security:
Client → CDN → WAF → Load Balancer → API (JWT auth) → Database (RLS)
```

---

## Disaster Recovery Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Primary Region (us-east-1)                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Application │  │   Database   │  │   Storage    │         │
│  │     Tier     │  │   (Primary)  │  │   (S3)       │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
│         │  Continuous     │  Async           │  Cross-region   │
│         │  Replication    │  Replication     │  Replication    │
│         │                 │                  │                  │
└─────────┼─────────────────┼──────────────────┼──────────────────┘
          │                 │                  │
          │                 │                  │
┌─────────▼─────────────────▼──────────────────▼──────────────────┐
│                  DR Region (us-west-2)                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Application │  │   Database   │  │   Storage    │         │
│  │  (Standby)   │  │   (Replica)  │  │  (Replica)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  RTO: 15 minutes │  RPO: 5 minutes                             │
└──────────────────────────────────────────────────────────────────┘

Failover Process:
1. Detect primary region failure (automated health checks)
2. Promote DR database to primary
3. Update DNS (Route 53 health check based failover)
4. Scale up DR application tier
5. Verify system health
6. Notify team
```

---

This comprehensive architecture documentation provides complete visibility into all three deployment options with detailed diagrams, data flows, and deployment patterns. The diagrams use ASCII art for maximum compatibility and clarity.
