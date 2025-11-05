/**
 * Wishlist Starter Templates
 * Copy-paste ready implementations for different stacks
 */

// =============================================================================
// TEMPLATE 1: React + shadcn/ui + Zustand (RECOMMENDED)
// =============================================================================

// 1. Install dependencies:
// npm install react react-dom zustand @dnd-kit/core @dnd-kit/sortable
// npx shadcn-ui@latest init
// npx shadcn-ui@latest add card dialog button

// 2. Store (src/store/wishlistStore.ts)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistItem {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string
}

interface WishlistStore {
  items: WishlistItem[]
  selectedItem: WishlistItem | null
  isModalOpen: boolean
  addItem: (item: Omit<WishlistItem, 'id'>) => void
  removeItem: (id: string) => void
  openModal: (item: WishlistItem) => void
  closeModal: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set) => ({
      items: [],
      selectedItem: null,
      isModalOpen: false,

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, { ...item, id: crypto.randomUUID() }],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      openModal: (item) =>
        set({ selectedItem: item, isModalOpen: true }),

      closeModal: () =>
        set({ isModalOpen: false, selectedItem: null }),
    }),
    { name: 'wishlist-storage' }
  )
)

// 3. Card Component (src/components/WishlistCard.tsx)
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface WishlistCardProps {
  item: WishlistItem
  onViewDetails: (item: WishlistItem) => void
  onRemove: (id: string) => void
}

export function WishlistCard({ item, onViewDetails, onRemove }: WishlistCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-1">{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {item.description}
        </p>
        <p className="text-2xl font-bold text-primary">
          ${item.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          onClick={() => onViewDetails(item)}
          variant="outline"
          className="flex-1"
        >
          Details
        </Button>
        <Button
          onClick={() => onRemove(item.id)}
          variant="destructive"
          className="flex-1"
        >
          Remove
        </Button>
      </CardFooter>
    </Card>
  )
}

// 4. Modal Component (src/components/WishlistModal.tsx)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface WishlistModalProps {
  item: WishlistItem | null
  isOpen: boolean
  onClose: () => void
}

export function WishlistModal({ item, isOpen, onClose }: WishlistModalProps) {
  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{item.title}</DialogTitle>
          <DialogDescription>
            View detailed information about this item
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="aspect-square rounded-lg overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Price</h3>
              <p className="text-3xl font-bold text-primary">
                ${item.price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>Add to Cart</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 5. Grid Component (src/components/WishlistGrid.tsx)
export function WishlistGrid() {
  const { items, openModal, removeItem } = useWishlistStore()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {items.map((item) => (
        <WishlistCard
          key={item.id}
          item={item}
          onViewDetails={openModal}
          onRemove={removeItem}
        />
      ))}
    </div>
  )
}

// 6. Main App (src/App.tsx)
export function App() {
  const { isModalOpen, selectedItem, closeModal } = useWishlistStore()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">My Wishlist</h1>
        </div>
      </header>

      <main className="container mx-auto">
        <WishlistGrid />
      </main>

      <WishlistModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}

// =============================================================================
// TEMPLATE 2: React + @dnd-kit + Drag & Drop
// =============================================================================

// Install: npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Card Wrapper
function SortableCard({ item, onViewDetails, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <WishlistCard
        item={item}
        onViewDetails={onViewDetails}
        onRemove={onRemove}
      />
    </div>
  )
}

// Sortable Grid
export function SortableWishlistGrid() {
  const { items, openModal, removeItem } = useWishlistStore()
  const [localItems, setLocalItems] = useState(items)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setLocalItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localItems} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          {localItems.map((item) => (
            <SortableCard
              key={item.id}
              item={item}
              onViewDetails={openModal}
              onRemove={removeItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

// =============================================================================
// TEMPLATE 3: React + Chakra UI (Alternative)
// =============================================================================

// Install: npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion

import {
  ChakraProvider,
  Card,
  CardBody,
  CardFooter,
  Image,
  Stack,
  Heading,
  Text,
  Button,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react'

// Card with Chakra UI
function ChakraWishlistCard({ item }) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Card
        maxW="sm"
        overflow="hidden"
        _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
        transition="all 0.3s"
      >
        <Image
          src={item.imageUrl}
          alt={item.title}
          objectFit="cover"
          h="200px"
        />
        <CardBody>
          <Stack spacing={3}>
            <Heading size="md" noOfLines={1}>
              {item.title}
            </Heading>
            <Text noOfLines={2} color="gray.600">
              {item.description}
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              ${item.price.toFixed(2)}
            </Text>
          </Stack>
        </CardBody>
        <CardFooter>
          <ButtonGroup spacing={2} w="full">
            <Button flex={1} variant="outline" onClick={onOpen}>
              Details
            </Button>
            <Button flex={1} colorScheme="blue">
              Add to Cart
            </Button>
          </ButtonGroup>
        </CardFooter>
      </Card>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{item.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Image src={item.imageUrl} alt={item.title} borderRadius="lg" />
            <Text mt={4}>{item.description}</Text>
            <Text fontSize="3xl" fontWeight="bold" color="blue.600" mt={4}>
              ${item.price.toFixed(2)}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button colorScheme="blue">Add to Cart</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

// =============================================================================
// TEMPLATE 4: Virtual Scrolling for Large Lists
// =============================================================================

// Install: npm install @tanstack/react-virtual

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

export function VirtualWishlistGrid({ items }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(items.length / 4),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400,
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * 4
          const rowItems = items.slice(startIndex, startIndex + 4)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-4 gap-4 p-4">
                {rowItems.map((item) => (
                  <WishlistCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// TEMPLATE 5: Advanced Filters & Search
// =============================================================================

export function WishlistFilters() {
  const { items, filter, setFilter, sortBy, setSortBy } = useWishlistStore()
  const [search, setSearch] = useState('')
  const [priceRange, setPriceRange] = useState([0, 1000])

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Sort */}
      <div className="flex gap-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="date">Newest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="priority">Priority</option>
        </select>

        {/* Price Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm">Price:</span>
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
            className="flex-1"
          />
          <span className="text-sm font-semibold">
            ${priceRange[1]}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm text-gray-600">
        <span>{items.length} items</span>
        <span>Total: ${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
      </div>
    </div>
  )
}

// =============================================================================
// TEMPLATE 6: Responsive Mobile-First Grid
// =============================================================================

export function ResponsiveMobileGrid({ items }) {
  return (
    <div className="
      /* Mobile: Single column with padding */
      grid grid-cols-1 gap-4 p-4

      /* Small tablets: 2 columns */
      sm:grid-cols-2 sm:gap-5 sm:p-6

      /* Tablets: 3 columns */
      md:grid-cols-3 md:gap-6 md:p-8

      /* Desktop: 4 columns */
      lg:grid-cols-4 lg:gap-6

      /* Large desktop: 5 columns */
      xl:grid-cols-5

      /* Extra large: 6 columns */
      2xl:grid-cols-6
    ">
      {items.map((item) => (
        <WishlistCard key={item.id} item={item} />
      ))}
    </div>
  )
}

// =============================================================================
// QUICK SETUP COMMANDS
// =============================================================================

/*
# OPTION 1: React + shadcn/ui + Zustand (RECOMMENDED)
npx create-vite@latest my-wishlist -- --template react-ts
cd my-wishlist
npm install
npm install zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npx shadcn-ui@latest init
npx shadcn-ui@latest add card dialog button input

# OPTION 2: React + Chakra UI
npx create-vite@latest my-wishlist -- --template react-ts
cd my-wishlist
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion zustand

# OPTION 3: Next.js (Recommended for production)
npx create-next-app@latest my-wishlist --typescript --tailwind --app
cd my-wishlist
npm install zustand @dnd-kit/core @dnd-kit/sortable
npx shadcn-ui@latest init
npx shadcn-ui@latest add card dialog button

# OPTION 4: SolidJS (Best performance)
npx degit solidjs/templates/ts my-wishlist
cd my-wishlist
npm install
npm install @solid-primitives/storage
*/
