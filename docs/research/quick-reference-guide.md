# Wishlist UI - Quick Reference Guide

## 📋 Executive Summary

**Best Choice for Most Projects:**
- Framework: **React**
- UI Library: **shadcn/ui + Tailwind CSS**
- State: **Zustand**
- Drag & Drop: **@dnd-kit**
- Modals: **Radix UI Dialog** (via shadcn/ui)

**Bundle Size:** ~113KB gzipped
**Setup Time:** 15 minutes
**Learning Curve:** Moderate

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Create project
npx create-next-app@latest wishlist-app --typescript --tailwind --app
cd wishlist-app

# 2. Install dependencies
npm install zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# 3. Initialize shadcn/ui
npx shadcn-ui@latest init

# 4. Add components
npx shadcn-ui@latest add card dialog button

# 5. Start development
npm run dev
```

---

## 📊 Framework Decision Matrix

| Your Priority | Choose |
|--------------|--------|
| Fastest development | **React + shadcn/ui** |
| Best performance | **SolidJS** |
| Smallest bundle | **Svelte** |
| Easiest learning | **Vue 3** |
| Best ecosystem | **React** |
| Best for teams | **React + TypeScript** |

---

## 🎨 UI Library Comparison

### shadcn/ui ⭐ (Recommended)
**Pros:** Full control, copy-paste source, zero runtime, Radix UI powered
**Cons:** Manual updates, need to manage components
**Best For:** Custom designs, full flexibility
**Setup:** `npx shadcn-ui@latest init`

### Chakra UI
**Pros:** Complete system, excellent docs, great DX
**Cons:** 140KB bundle, harder customization
**Best For:** Rapid development, consistent design
**Setup:** `npm install @chakra-ui/react`

### Material-UI (MUI)
**Pros:** Most components, Material Design, enterprise-ready
**Cons:** 300KB bundle, complex theming
**Best For:** Enterprise apps, Material Design lovers
**Setup:** `npm install @mui/material @emotion/react`

### DaisyUI
**Pros:** 3KB bundle, pure CSS, Tailwind-based
**Cons:** Limited JS features, fewer components
**Best For:** Lightweight apps, static sites
**Setup:** `npm install daisyui`

---

## 🎯 Component Patterns

### Basic Card Component
```tsx
<Card>
  <img src={item.imageUrl} className="aspect-square" />
  <CardHeader>
    <CardTitle>{item.title}</CardTitle>
  </CardHeader>
  <CardContent>
    <p>${item.price}</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Modal with Dialog
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{item.title}</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

---

## 🏪 State Management Cheat Sheet

### Zustand (Recommended)
```tsx
const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
}))

// Usage
const items = useStore((state) => state.items)
const addItem = useStore((state) => state.addItem)
```

### Context API (Built-in)
```tsx
const WishlistContext = createContext()

function WishlistProvider({ children }) {
  const [items, setItems] = useState([])
  return (
    <WishlistContext.Provider value={{ items, setItems }}>
      {children}
    </WishlistContext.Provider>
  )
}
```

### Jotai (Atomic)
```tsx
const itemsAtom = atom([])

function Component() {
  const [items, setItems] = useAtom(itemsAtom)
}
```

---

## 🎪 Drag & Drop Implementation

### @dnd-kit Setup
```tsx
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'

function SortableCard({ id, children }) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id })

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

function Grid({ items }) {
  return (
    <DndContext collisionDetection={closestCenter}>
      <SortableContext items={items}>
        {items.map(item => (
          <SortableCard key={item.id} id={item.id}>
            <Card item={item} />
          </SortableCard>
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

---

## 📱 Responsive Design Patterns

### Mobile-First Grid
```css
/* Tailwind Classes */
grid
grid-cols-1           /* 1 column on mobile */
sm:grid-cols-2        /* 2 columns on tablets (640px+) */
md:grid-cols-3        /* 3 columns on small desktops (768px+) */
lg:grid-cols-4        /* 4 columns on desktops (1024px+) */
xl:grid-cols-5        /* 5 columns on large screens (1280px+) */
gap-4                 /* 1rem gap between items */
```

### Touch-Friendly Buttons
```tsx
<Button className="min-h-[44px] min-w-[44px]">
  {/* 44px is iOS minimum touch target */}
</Button>
```

### Responsive Modal
```tsx
<DialogContent className="
  max-w-[95vw] sm:max-w-[85vw] md:max-w-3xl
  max-h-[95vh] overflow-y-auto
">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Content */}
  </div>
</DialogContent>
```

---

## ⚡ Performance Optimization

### Image Optimization
```tsx
// Next.js Image (best)
<Image
  src={item.imageUrl}
  alt={item.title}
  width={300}
  height={300}
  loading="lazy"
  placeholder="blur"
/>

// Native HTML
<img
  src={item.imageUrl}
  alt={item.title}
  loading="lazy"
  decoding="async"
/>
```

### Code Splitting
```tsx
// Lazy load components
const Modal = lazy(() => import('./Modal'))

// Usage
<Suspense fallback={<Loading />}>
  <Modal />
</Suspense>
```

### Virtual Scrolling (1000+ items)
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 400,
})
```

---

## 🔧 Common Patterns & Solutions

### Add Item to Wishlist
```tsx
const addItem = (item) => {
  useStore.setState((state) => ({
    items: [...state.items, { ...item, id: crypto.randomUUID() }]
  }))
}
```

### Filter Items
```tsx
const filteredItems = items.filter(item =>
  item.title.toLowerCase().includes(search.toLowerCase())
)
```

### Sort Items
```tsx
const sortedItems = [...items].sort((a, b) => {
  switch (sortBy) {
    case 'price': return a.price - b.price
    case 'date': return b.addedAt - a.addedAt
    default: return 0
  }
})
```

### Calculate Total
```tsx
const total = items.reduce((sum, item) => sum + item.price, 0)
```

### Persist to LocalStorage
```tsx
// With Zustand
const useStore = create(
  persist(
    (set) => ({ items: [] }),
    { name: 'wishlist-storage' }
  )
)

// Manual
useEffect(() => {
  localStorage.setItem('wishlist', JSON.stringify(items))
}, [items])
```

---

## 🎨 Tailwind CSS Cheat Sheet

### Card Styling
```css
/* Container */
rounded-lg           /* Rounded corners */
shadow-md            /* Medium shadow */
hover:shadow-xl      /* Larger shadow on hover */
transition-all       /* Smooth transitions */
overflow-hidden      /* Clip overflow */

/* Image Container */
aspect-square        /* 1:1 aspect ratio */
aspect-[4/3]         /* 4:3 aspect ratio */
object-cover         /* Cover container */
hover:scale-105      /* Zoom on hover */

/* Text */
line-clamp-1         /* Truncate to 1 line */
line-clamp-2         /* Truncate to 2 lines */
text-muted-foreground /* Muted text color */

/* Spacing */
p-4                  /* Padding: 1rem */
gap-4                /* Gap: 1rem */
space-y-4            /* Vertical spacing: 1rem */
```

---

## 🛠️ Debugging & DevTools

### Zustand DevTools
```tsx
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools((set) => ({
    items: [],
  }))
)
```

### React DevTools
```bash
# Install Chrome Extension
https://chrome.google.com/webstore/detail/react-developer-tools
```

### Performance Profiling
```tsx
import { Profiler } from 'react'

<Profiler id="WishlistGrid" onRender={(id, phase, duration) => {
  console.log(`${id} ${phase}: ${duration}ms`)
}}>
  <WishlistGrid />
</Profiler>
```

---

## 📦 Package Versions (Verified Compatible)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "tailwindcss": "^3.4.0",
    "@tanstack/react-virtual": "^3.0.0"
  }
}
```

---

## 🚨 Common Pitfalls & Solutions

### Problem: Modal doesn't close on backdrop click
**Solution:** Use Radix UI Dialog or add onClick handler
```tsx
<div onClick={onClose} className="fixed inset-0 bg-black/50" />
```

### Problem: Drag & drop not working on touch devices
**Solution:** Use @dnd-kit with PointerSensor
```tsx
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }
  })
)
```

### Problem: Images loading slowly
**Solution:** Use lazy loading and proper sizing
```tsx
<img loading="lazy" width="300" height="300" />
```

### Problem: State not persisting
**Solution:** Use Zustand persist middleware
```tsx
persist((set) => ({ items: [] }), { name: 'storage-key' })
```

---

## 🎓 Learning Resources

### Official Docs
- React: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- Zustand: https://docs.pmnd.rs/zustand
- @dnd-kit: https://docs.dndkit.com

### Video Tutorials
- shadcn/ui Setup: YouTube → "shadcn ui tutorial"
- @dnd-kit Tutorial: YouTube → "dnd-kit react tutorial"
- Zustand Guide: YouTube → "zustand state management"

### Code Examples
- shadcn/ui Examples: https://ui.shadcn.com/examples
- @dnd-kit Examples: https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com

---

## 🎯 Project Checklist

- [ ] Choose framework (React recommended)
- [ ] Setup UI library (shadcn/ui recommended)
- [ ] Implement state management (Zustand recommended)
- [ ] Create card component with responsive design
- [ ] Add modal/dialog with accessibility
- [ ] Implement drag & drop (optional but recommended)
- [ ] Add filters and search
- [ ] Optimize images (lazy loading)
- [ ] Add LocalStorage persistence
- [ ] Implement responsive grid
- [ ] Add loading states
- [ ] Handle error states
- [ ] Add TypeScript types
- [ ] Write tests (optional)
- [ ] Optimize bundle size
- [ ] Add PWA support (optional)

---

## 💡 Pro Tips

1. **Start Simple:** Begin with basic grid and cards, add features incrementally
2. **Mobile First:** Design for mobile, scale up to desktop
3. **Performance:** Use virtual scrolling for 1000+ items
4. **Accessibility:** Always include proper ARIA labels and keyboard navigation
5. **TypeScript:** Use TypeScript for better DX and fewer bugs
6. **Testing:** Write tests for critical user flows
7. **Analytics:** Track user interactions for insights
8. **Caching:** Cache images and API responses
9. **Error Handling:** Always handle loading and error states
10. **User Feedback:** Add loading spinners and success messages

---

## 📞 Getting Help

- **Stack Overflow:** Tag with `reactjs`, `tailwindcss`, `zustand`
- **Discord:** Join shadcn/ui, Zustand, @dnd-kit communities
- **GitHub Issues:** Check library GitHub repos for known issues
- **Reddit:** r/reactjs, r/webdev for community help

---

**Last Updated:** January 2025
**Compatibility:** React 18+, Next.js 14+, Node.js 18+
