# Quick Reference Guide - Real-Time Collaboration for Wishlist Apps

## 🎯 TL;DR - Executive Summary

**Best Stack:** Supabase + Next.js + PWA
**Timeline:** 3-4 weeks
**Cost:** $0-25/month (small scale)
**Key Features:** Real-time sync, offline support, magic link auth

---

## 📊 Technology Decision Matrix

| If You Need... | Choose... | Why? |
|---------------|-----------|------|
| Fast MVP | Firebase | Zero config, instant real-time |
| SQL Database | Supabase | PostgreSQL with real-time |
| Low Cost | Supabase | Best free tier, affordable scaling |
| Full Control | Socket.IO + PostgreSQL | Maximum flexibility |
| Offline-First | Supabase + IndexedDB | Good PWA support |
| Open Source | Supabase | Self-hostable, MIT license |

---

## 🚀 Quick Start Checklist

### Week 1: Foundation
- [ ] Create Supabase project
- [ ] Setup Next.js app
- [ ] Configure authentication (magic links)
- [ ] Create database schema
- [ ] Setup Row-Level Security policies

### Week 2: Core Features
- [ ] Build list CRUD operations
- [ ] Implement real-time subscriptions
- [ ] Add item management
- [ ] Create share links
- [ ] Add permission system

### Week 3: Collaboration
- [ ] Implement presence indicators
- [ ] Add activity feed
- [ ] Purchase reservation system
- [ ] Build invite code system
- [ ] Add real-time notifications

### Week 4: Polish
- [ ] Service Worker setup
- [ ] IndexedDB caching
- [ ] Optimistic updates
- [ ] PWA manifest
- [ ] Testing & deployment

---

## 💰 Cost Breakdown

### Supabase Pricing
```
Free Tier:
├─ 500MB database storage
├─ 1GB file storage
├─ 50K monthly active users
├─ Unlimited API requests
└─ Good for: 0-1000 users

Pro ($25/month):
├─ 8GB database storage
├─ 100GB file storage
├─ 100K monthly active users
├─ Daily backups
└─ Good for: 1K-50K users

Enterprise ($500+/month):
├─ Custom limits
├─ Dedicated support
├─ SLA guarantees
└─ Good for: 50K+ users
```

### Total Monthly Costs
```
Startup (0-1K users):
├─ Supabase: $0
├─ Vercel: $0
├─ Email (Resend): $0
└─ Total: $0/month

Growing (10K users):
├─ Supabase: $25
├─ Vercel: $0-20
├─ Email: $10
└─ Total: $35-55/month

Established (100K users):
├─ Supabase: $100-300
├─ Vercel: $20-50
├─ Email: $50-100
└─ Total: $170-450/month
```

---

## 🔧 Essential Code Snippets

### 1. Real-time Subscription
```typescript
const { data, error } = supabase
  .channel(`list:${listId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'items',
    filter: `list_id=eq.${listId}`
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

### 2. Magic Link Auth
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: userEmail,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
});
```

### 3. Optimistic Update
```typescript
// 1. Update UI immediately
updateItemInUI(itemId, changes);

// 2. Save to IndexedDB
await db.items.update(itemId, changes);

// 3. Sync with server
try {
  await supabase.from('items').update(changes).eq('id', itemId);
} catch (error) {
  // Rollback on error
  revertItemInUI(itemId);
}
```

### 4. Presence Tracking
```typescript
const channel = supabase.channel(`presence:${listId}`)
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    updatePresenceUI(state);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id, user_name, color });
    }
  });
```

---

## 🗄️ Essential Database Schema

```sql
-- Core tables (simplified)
CREATE TABLE lists (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  owner_id UUID REFERENCES users(id)
);

CREATE TABLE items (
  id UUID PRIMARY KEY,
  list_id UUID REFERENCES lists(id),
  name TEXT NOT NULL,
  purchased BOOLEAN DEFAULT FALSE,
  purchased_by UUID REFERENCES users(id)
);

CREATE TABLE list_members (
  list_id UUID REFERENCES lists(id),
  user_id UUID REFERENCES users(id),
  permission TEXT DEFAULT 'viewer'
);
```

---

## 🎨 Key UI Components

### 1. Offline Banner
```tsx
function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      You're offline. Changes will sync when you reconnect.
    </div>
  );
}
```

### 2. Presence Avatars
```tsx
function PresenceAvatars({ users }) {
  return (
    <div className="presence-bar">
      {users.map(user => (
        <Avatar
          key={user.id}
          src={user.avatar}
          color={user.color}
          online={true}
        />
      ))}
    </div>
  );
}
```

### 3. Purchase Button
```tsx
function PurchaseButton({ item }) {
  const [reserving, setReserving] = useState(false);

  const handlePurchase = async () => {
    setReserving(true);
    try {
      await markAsPurchased(item.id, currentUser.id);
    } catch (error) {
      alert(error.message); // Already reserved by someone
    } finally {
      setReserving(false);
    }
  };

  return (
    <button onClick={handlePurchase} disabled={reserving}>
      {item.purchased ? 'Purchased ✓' : 'Mark as Purchased'}
    </button>
  );
}
```

---

## 🔐 Security Checklist

- [ ] Row-Level Security (RLS) policies enabled
- [ ] Rate limiting on auth endpoints (5 attempts/15min)
- [ ] Input validation with Zod
- [ ] SQL injection prevention (Supabase auto-escapes)
- [ ] XSS prevention (Content Security Policy)
- [ ] HTTPS enforcement
- [ ] Secure session management (JWT)
- [ ] Sensitive data encryption at rest

---

## 📱 PWA Configuration

### manifest.json
```json
{
  "name": "Christmas Wishlist",
  "short_name": "Wishlist",
  "description": "Share your Christmas wishlist with family",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#c41e3a",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker Strategy
```typescript
// Cache-first for static assets
// Network-first for dynamic data
// Background sync for offline operations

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network-first for API calls
    event.respondWith(networkFirst(event.request));
  } else {
    // Cache-first for static files
    event.respondWith(cacheFirst(event.request));
  }
});
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Real-time not updating
**Solution:** Check RLS policies, ensure user has proper permissions
```sql
-- Verify policy
SELECT * FROM list_members WHERE user_id = 'current_user_id';
```

### Issue 2: Offline sync conflicts
**Solution:** Implement version numbers for optimistic concurrency
```typescript
await supabase
  .from('items')
  .update({ ...changes, version: currentVersion + 1 })
  .eq('id', itemId)
  .eq('version', currentVersion); // Prevents conflicts
```

### Issue 3: Presence not tracking
**Solution:** Ensure heartbeat is running
```typescript
// Send presence update every 30 seconds
setInterval(() => {
  channel.track({ user_id, online_at: new Date() });
}, 30000);
```

---

## 📊 Performance Benchmarks

### Target Metrics
```
Page Load: < 2 seconds
Time to Interactive: < 3 seconds
Real-time Latency: < 500ms
Lighthouse Score: > 90
Offline Cache Size: < 50MB
Background Sync: < 10 seconds
```

### Optimization Tips
1. **Virtual Scrolling** - For lists > 100 items
2. **Image Optimization** - Next.js Image component
3. **Code Splitting** - Dynamic imports for routes
4. **Database Indexes** - On list_id, user_id, purchased
5. **CDN Caching** - Static assets via Vercel Edge

---

## 🔗 Essential Links

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Dexie.js Docs](https://dexie.org/)
- [PWA Guide](https://web.dev/progressive-web-apps/)

### Tools
- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Lighthouse DevTools](https://developers.google.com/web/tools/lighthouse)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [r/webdev](https://reddit.com/r/webdev)

---

## 📝 Testing Checklist

### Functional Testing
- [ ] User can create list
- [ ] User can add items
- [ ] Real-time updates work across devices
- [ ] Share links work
- [ ] Purchase reservation prevents duplicates
- [ ] Offline mode saves changes
- [ ] Changes sync when back online

### Performance Testing
- [ ] Page loads in < 2s
- [ ] Real-time latency < 500ms
- [ ] Works with 100+ items
- [ ] Handles 10+ concurrent users
- [ ] Offline cache < 50MB

### Security Testing
- [ ] Can't access other users' private lists
- [ ] Can't edit without permission
- [ ] Rate limiting prevents abuse
- [ ] XSS attempts blocked
- [ ] SQL injection prevented

### Browser Testing
- [ ] Chrome (desktop & mobile)
- [ ] Safari (iOS & macOS)
- [ ] Firefox
- [ ] Edge

---

## 🎯 Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Lists created per user
- Items added per list
- Shares per list
- Time spent in app

### Technical Metrics
- Real-time message delivery rate (>99%)
- Sync success rate (>98%)
- Offline capability uptime (100%)
- Page load time (<2s)
- Crash-free rate (>99.9%)

### Business Metrics
- User retention (7-day, 30-day)
- Viral coefficient (shares/user)
- Conversion rate (guest → registered)
- Cost per user (<$0.10)

---

## 🚨 Production Deployment

### Pre-Launch
```bash
# 1. Build production bundle
npm run build

# 2. Run production locally
npm start

# 3. Test all features
npm run test

# 4. Check Lighthouse score
npm run lighthouse

# 5. Deploy to Vercel
vercel --prod
```

### Post-Launch Monitoring
- [ ] Setup Sentry for error tracking
- [ ] Configure Plausible for analytics
- [ ] Setup uptime monitoring (UptimeRobot)
- [ ] Enable Supabase metrics
- [ ] Create status page (StatusPage.io)

---

## 📞 Support & Resources

### Need Help?
1. Check main documentation: `realtime-collaboration-patterns.md`
2. Review code examples: `examples/` directory
3. Search Supabase Discord
4. Ask on Stack Overflow with tags: `supabase` `nextjs` `pwa`

### Found a Bug?
1. Check if it's a known issue
2. Create minimal reproduction
3. File issue with details
4. Include environment info

---

**Quick Reference Version:** 1.0
**Last Updated:** 2025-01-02

**Need detailed information?** See the main research documents! 🎄
