# Architecture Decision Records (ADRs)

## Overview
This document contains the key architectural decisions made during the design of the Christmas Wishlist application, following the ADR format for documentation and future reference.

---

## ADR-001: Database Choice (SQL vs NoSQL)

**Status:** Proposed
**Date:** 2024-12-01
**Decision Makers:** Architecture Team

### Context
We need to choose between SQL (PostgreSQL) and NoSQL (Firestore) databases for storing application data including users, locations, lists, items, and sharing relationships.

### Decision Drivers
- Complex relational data with many foreign keys
- Need for ACID transactions
- Query complexity requirements
- Real-time update capabilities
- Team expertise
- Cost at scale
- Future migration flexibility

### Options Considered

#### Option 1: Firebase Firestore (NoSQL)
**Pros:**
- Built-in real-time subscriptions
- Zero infrastructure management
- Fast initial development
- Integrated with Firebase Auth and Storage

**Cons:**
- Limited query capabilities (no complex joins)
- Data denormalization required
- Vendor lock-in
- Expensive at scale
- No native transaction support across collections

#### Option 2: PostgreSQL (SQL)
**Pros:**
- Complex queries and joins
- ACID transactions
- Referential integrity with foreign keys
- Mature ecosystem
- Better cost efficiency at scale
- Can self-host (no vendor lock-in)

**Cons:**
- More setup complexity
- Real-time features require additional implementation
- Need to manage infrastructure (or use managed service)

### Decision
**We recommend offering three options** with different database choices:
- **Option 1 (Firebase):** Firestore for rapid MVP development
- **Option 2 (Supabase):** PostgreSQL with built-in real-time and easy setup
- **Option 3 (Custom):** PostgreSQL with full control for enterprise needs

**For most startups, we recommend Option 2 (Supabase + PostgreSQL)** as it provides:
- SQL benefits with relational data modeling
- Real-time subscriptions built-in
- Open-source (no vendor lock-in)
- Better cost efficiency at scale
- Migration path to custom backend if needed

### Consequences
- **Positive:** Flexibility to choose based on project stage and requirements
- **Positive:** Clear migration path from simple to complex architecture
- **Negative:** Need to maintain documentation for multiple approaches
- **Negative:** Team needs to understand trade-offs of each option

---

## ADR-002: Authentication Provider Selection

**Status:** Proposed
**Date:** 2024-12-01

### Context
We need a secure, reliable authentication system that supports email/password and OAuth providers (Google, Facebook, Apple).

### Options Considered

#### Option 1: Build Custom Auth
**Pros:**
- Full control over authentication flow
- No third-party dependencies
- No per-user costs

**Cons:**
- High development time (2-4 weeks)
- Security risks if not implemented correctly
- Need to maintain password reset, email verification
- OAuth integration complexity

#### Option 2: Firebase Authentication
**Pros:**
- Tight integration with Firestore
- Free tier (50k MAU)
- Easy setup (< 1 day)
- Built-in OAuth providers

**Cons:**
- Vendor lock-in
- Limited customization
- Pricing can increase significantly at scale

#### Option 3: Clerk
**Pros:**
- Modern developer experience
- Beautiful pre-built UI components
- User management dashboard
- Supports all major OAuth providers
- Webhooks for user events

**Cons:**
- Costs $25/month (10k MAU)
- External dependency

#### Option 4: Auth0
**Pros:**
- Enterprise-grade security
- Extensive customization options
- Good documentation
- Industry standard

**Cons:**
- Complex setup
- Expensive ($240/year for 7k MAU)
- Steeper learning curve

### Decision
**Recommended approach by architecture option:**

- **Option 1 (Firebase):** Use Firebase Authentication for tight integration
- **Option 2 (Supabase):** Use Supabase Auth (built-in, similar to Firebase)
- **Option 3 (Custom):** Use **Clerk** for best developer experience and user management

**Rationale for Clerk (Option 3):**
- Modern, well-designed authentication UI
- Excellent Next.js/React integration
- User management dashboard included
- Reasonable pricing for startups
- Easy migration path if needed (JWT standard)

### Consequences
- **Positive:** Reduce development time by 2-4 weeks
- **Positive:** Security best practices handled by experts
- **Positive:** User management UI included
- **Negative:** Monthly cost ($25-50/month)
- **Negative:** External dependency on third-party service

---

## ADR-003: File Storage Strategy

**Status:** Proposed
**Date:** 2024-12-01

### Context
Need to store user avatars and product images with the following requirements:
- Fast upload and retrieval
- Image optimization (resizing, compression)
- CDN delivery for performance
- Cost-effective at scale

### Options Considered

#### Option 1: Firebase Cloud Storage
**Pros:**
- Integrated with Firebase ecosystem
- Built-in CDN
- Simple upload from client
- Generous free tier (5GB)

**Cons:**
- Expensive at scale ($0.026/GB)
- Limited image transformation features
- Vendor lock-in

#### Option 2: Cloudinary
**Pros:**
- Excellent image transformation API
- Real-time image optimization
- Automatic format selection (WebP, AVIF)
- Free tier (25GB)

**Cons:**
- More expensive than S3 ($0.18/GB)
- Another external service to manage

#### Option 3: AWS S3 + CloudFront
**Pros:**
- Most cost-effective ($0.023/GB for storage, $0.085/GB transfer)
- Full control over storage policies
- Industry standard
- Can use Lambda for image processing

**Cons:**
- More setup complexity
- Need to implement image processing separately

#### Option 4: Supabase Storage
**Pros:**
- Integrated with Supabase platform
- Built on S3, same reliability
- Includes CDN
- Free tier (1GB)

**Cons:**
- Less mature than other options
- Limited transformation features

### Decision
**Recommended by architecture option:**

- **Option 1 (Firebase):** Firebase Cloud Storage for ecosystem integration
- **Option 2 (Supabase):** Supabase Storage for easy setup and CDN
- **Option 3 (Custom):** **AWS S3 + CloudFront** for cost and control

**For custom backend, implement with:**
```typescript
// Image upload to S3 with optimization
- Upload original to S3
- Lambda function triggers on upload
- Sharp library resizes to multiple sizes (thumbnail, medium, large)
- Store optimized versions in S3
- CloudFront serves cached versions globally
```

### Consequences
- **Positive:** Cost-effective solution at scale
- **Positive:** Fast global delivery via CDN
- **Positive:** No vendor lock-in (S3 is industry standard)
- **Negative:** Need to implement image processing pipeline
- **Negative:** More AWS services to manage

---

## ADR-004: Real-time Updates Implementation

**Status:** Proposed
**Date:** 2024-12-01

### Context
Users need to see real-time updates when other family members:
- Add new items to shared lists
- Mark items as purchased
- Edit or delete items
- Share or revoke access

### Options Considered

#### Option 1: Polling (HTTP)
```typescript
// Client polls every 5 seconds
setInterval(() => {
  fetch('/api/lists/123/items')
}, 5000)
```

**Pros:**
- Simple to implement
- Works with any backend
- Easy to debug

**Cons:**
- Inefficient (wasted requests)
- High latency (up to 5 seconds)
- Increased server load
- Increased data transfer costs

#### Option 2: Server-Sent Events (SSE)
```typescript
const eventSource = new EventSource('/api/lists/123/stream')
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  updateUI(data)
}
```

**Pros:**
- One-way server to client (sufficient for most cases)
- Built on HTTP (no firewall issues)
- Automatic reconnection
- Simpler than WebSockets

**Cons:**
- Limited to text data
- No bidirectional communication
- Connection limits in browsers (6 per domain)

#### Option 3: WebSockets
```typescript
const ws = new WebSocket('wss://api.app.com/ws')
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  updateUI(data)
}
```

**Pros:**
- True bidirectional communication
- Low latency (< 50ms)
- Binary data support
- Industry standard for real-time apps

**Cons:**
- More complex to implement
- Requires maintaining open connections
- Scaling WebSockets requires sticky sessions

#### Option 4: Firebase Firestore Realtime
```typescript
db.collection('items')
  .where('listId', '==', '123')
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        addItemToUI(change.doc.data())
      }
    })
  })
```

**Pros:**
- Built-in, zero setup
- Automatic reconnection
- Works offline
- Handles all complexity

**Cons:**
- Vendor lock-in
- Counts toward read quotas
- Limited to Firestore data

#### Option 5: Supabase Realtime
```typescript
const subscription = supabase
  .channel('items')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'items' },
    (payload) => updateUI(payload)
  )
  .subscribe()
```

**Pros:**
- Built-in, easy setup
- PostgreSQL change streams
- Low latency
- No vendor lock-in (can self-host)

**Cons:**
- Requires Supabase platform
- Less mature than Firebase

### Decision
**Recommended by architecture option:**

- **Option 1 (Firebase):** Firebase Firestore Realtime (built-in)
- **Option 2 (Supabase):** Supabase Realtime (PostgreSQL change streams)
- **Option 3 (Custom):** **WebSockets with Socket.io**

**For custom backend implementation:**
```typescript
// Server (Express + Socket.io)
io.on('connection', (socket) => {
  socket.on('subscribe_list', (listId) => {
    // Verify user has access to list
    socket.join(`list:${listId}`)
  })
})

// Emit updates after database changes
await db.items.create(item)
io.to(`list:${item.listId}`).emit('item_created', item)

// Client (React + Socket.io)
socket.on('item_created', (item) => {
  setItems(prev => [...prev, item])
})
```

**Scaling considerations:**
- Use Redis adapter for multi-server Socket.io
- Implement sticky sessions at load balancer
- Consider AWS IoT Core for extreme scale (1M+ concurrent connections)

### Consequences
- **Positive:** Excellent user experience with instant updates
- **Positive:** Reduces API polling overhead
- **Positive:** Industry-standard approach (Socket.io)
- **Negative:** Need to manage WebSocket connections
- **Negative:** Requires Redis for multi-server deployments

---

## ADR-005: API Design (REST vs GraphQL)

**Status:** Proposed
**Date:** 2024-12-01

### Context
Need to decide on API architecture for client-server communication.

### Options Considered

#### Option 1: REST API
```
GET    /api/v1/lists/:id
POST   /api/v1/lists
PATCH  /api/v1/lists/:id
DELETE /api/v1/lists/:id
GET    /api/v1/lists/:id/items
```

**Pros:**
- Simple, well-understood
- Easy to cache (HTTP caching)
- Good tooling (Postman, Swagger)
- Stateless

**Cons:**
- Over-fetching (get more data than needed)
- Under-fetching (need multiple requests)
- Versioning challenges

#### Option 2: GraphQL
```graphql
query GetList($id: ID!) {
  list(id: $id) {
    id
    title
    items {
      id
      title
      price
    }
  }
}
```

**Pros:**
- Fetch exactly what you need
- Single endpoint
- Strong typing
- Great developer experience

**Cons:**
- More complex to implement
- Harder to cache
- Can lead to N+1 query problems
- Steeper learning curve

#### Option 3: Hybrid (REST + GraphQL)
- REST for simple CRUD operations
- GraphQL for complex queries with relationships

### Decision
**Recommended approach:**

- **Option 1 & 2 (Firebase/Supabase):** Use platform SDKs (not traditional REST/GraphQL)
- **Option 3 (Custom):** Start with **REST**, add **GraphQL** later if needed

**Rationale for REST-first:**
- Simpler initial implementation (2-3 weeks vs 4-6 weeks for GraphQL)
- Easier for mobile app developers to consume
- Better HTTP caching support
- Can add GraphQL endpoint later for complex frontend needs

**REST API Best Practices:**
```typescript
// Include related data with query params
GET /api/v1/lists/123?include=items,location

// Pagination
GET /api/v1/items?list_id=123&page=1&limit=50

// Filtering
GET /api/v1/items?list_id=123&is_purchased=false&priority=high

// Sorting
GET /api/v1/items?list_id=123&sort=created_at&order=desc
```

### Consequences
- **Positive:** Faster initial development
- **Positive:** Easier for team to learn
- **Positive:** Better caching support
- **Negative:** May need GraphQL later for complex queries
- **Negative:** Potential over-fetching on some endpoints

---

## ADR-006: State Management (Frontend)

**Status:** Proposed
**Date:** 2024-12-01

### Context
Need to manage application state on the frontend including:
- User authentication state
- Current list/items being viewed
- Real-time updates
- Optimistic UI updates

### Options Considered

#### Option 1: React Context + Hooks
**Pros:**
- Built into React
- No extra dependencies
- Simple for small apps

**Cons:**
- Can cause unnecessary re-renders
- Difficult to debug
- No dev tools

#### Option 2: Redux Toolkit
**Pros:**
- Industry standard
- Excellent dev tools
- Middleware for async logic
- Time-travel debugging

**Cons:**
- Boilerplate code
- Learning curve
- Overkill for simple apps

#### Option 3: Zustand
**Pros:**
- Minimal boilerplate
- Easy to learn
- Good performance
- TypeScript support

**Cons:**
- Less ecosystem than Redux
- No official dev tools

#### Option 4: React Query + Context
**Pros:**
- Excellent for server state
- Automatic caching and refetching
- Optimistic updates
- Small bundle size

**Cons:**
- Need Context for client state
- Another library to learn

### Decision
**Recommended: React Query + Zustand**

```typescript
// React Query for server state (lists, items)
const { data: items, mutate } = useQuery({
  queryKey: ['items', listId],
  queryFn: () => fetchItems(listId)
})

// Zustand for client state (UI state, user prefs)
const useStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  }))
}))
```

**Rationale:**
- React Query handles all server state complexity (caching, refetching, optimistic updates)
- Zustand provides simple, performant client state management
- Best of both worlds with minimal boilerplate

### Consequences
- **Positive:** Excellent developer experience
- **Positive:** Automatic cache invalidation and refetching
- **Positive:** Built-in optimistic updates
- **Positive:** Reduced bundle size vs Redux
- **Negative:** Need to learn two libraries (but both are simple)

---

## ADR-007: Mobile Strategy

**Status:** Proposed
**Date:** 2024-12-01

### Context
Need to decide on mobile app strategy to complement web application.

### Options Considered

#### Option 1: Progressive Web App (PWA)
**Pros:**
- Single codebase with web
- No app store approval needed
- Easy to update
- Works offline

**Cons:**
- Limited iOS capabilities
- No push notifications on iOS
- Less "native" feel

#### Option 2: React Native
**Pros:**
- Shared logic with web (React)
- Native performance
- Access to all native APIs
- Good developer experience

**Cons:**
- Separate codebase maintenance
- Need native developers for complex features
- Platform-specific bugs

#### Option 3: Native (Swift + Kotlin)
**Pros:**
- Best performance
- Full platform capabilities
- Best user experience

**Cons:**
- Two separate codebases
- Need iOS and Android developers
- Slowest development time

### Decision
**Phased approach:**

**Phase 1 (MVP):** PWA only
- Add PWA manifest and service worker
- Enable offline support
- Add to home screen capability

**Phase 2 (Growth):** React Native apps
- Build when web product is validated
- Share business logic between web and mobile
- Publish to App Store and Google Play

**Phase 3 (Scale):** Consider native if needed
- Only if performance or UX requires it

### Consequences
- **Positive:** Faster time to market (PWA is 2-3 weeks)
- **Positive:** Single codebase maintenance initially
- **Positive:** Can validate product before investing in native apps
- **Negative:** Limited mobile capabilities in Phase 1
- **Negative:** Will need mobile developers later

---

## Summary Table

| ADR | Decision | Rationale | Impact |
|-----|----------|-----------|--------|
| 001 | PostgreSQL (Supabase) | Relational data, SQL benefits, cost efficiency | Medium |
| 002 | Clerk (Custom), Firebase Auth (Firebase), Supabase Auth (Supabase) | Modern UX, security best practices | Low |
| 003 | AWS S3 + CloudFront | Cost-effective, scalable, no lock-in | Medium |
| 004 | WebSockets (Socket.io) | Real-time performance, bidirectional | High |
| 005 | REST API | Simple, well-understood, good caching | Medium |
| 006 | React Query + Zustand | Best DX, automatic caching, minimal boilerplate | Low |
| 007 | PWA → React Native | Validate product, then scale to native | High |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-01 | Architecture Team | Initial ADRs created |

---

## Next Steps

1. Review ADRs with stakeholders
2. Validate decisions with development team
3. Update ADRs as requirements change
4. Create implementation plan based on decisions
