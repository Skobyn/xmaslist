/**
 * ItemModal Component
 * Full-screen modal for viewing item details with edit and purchase actions
 * Fully accessible with WCAG 2.1 AA compliance
 */

import * as React from 'react';
import {
  ExternalLink,
  Edit2,
  Trash2,
  ShoppingCart,
  Check,
  X,
  Package,
  DollarSign,
  Tag,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WishlistItem } from '@/types/wishlist';
import {
  formatPrice,
  formatShortDate,
  getDomain,
  getPriorityColor,
  getPriorityLabel,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

// ============================================================================
// Component Props
// ============================================================================

export interface ItemModalProps {
  item: WishlistItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (item: WishlistItem) => void;
  onDelete?: (item: WishlistItem) => void;
  onPurchase?: (item: WishlistItem) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canPurchase?: boolean;
}

// ============================================================================
// ItemModal Component
// ============================================================================

export const ItemModal: React.FC<ItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onPurchase,
  canEdit = true,
  canDelete = true,
  canPurchase = true,
}) => {
  if (!item) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(item);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item);
      onClose();
    }
  };

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(item);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[85vw] md:max-w-4xl max-h-[95vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl sm:text-2xl pr-8">
                {item.title}
              </DialogTitle>
              {item.category && (
                <DialogDescription className="mt-1.5 flex items-center gap-1.5">
                  <Tag className="h-3 w-3" />
                  {item.category}
                </DialogDescription>
              )}
            </div>

            {/* Priority Badge */}
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap',
                getPriorityColor(item.priority)
              )}
            >
              {getPriorityLabel(item.priority)}
            </span>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="max-h-[calc(95vh-200px)]">
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="aspect-square sm:aspect-[4/3] md:aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Purchase Status */}
                {item.is_purchased && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Item Purchased
                      </p>
                      {item.purchased_by && (
                        <p className="text-xs text-green-700 dark:text-green-300">
                          by {item.purchased_by}
                        </p>
                      )}
                      {item.purchased_at && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          on {formatShortDate(item.purchased_at)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="space-y-6">
                {/* Price */}
                {item.price !== undefined && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" />
                      Price
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {formatPrice(item.price, item.currency)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Quantity: {item.quantity} ({formatPrice(item.price * item.quantity, item.currency)} total)
                      </p>
                    )}
                  </div>
                )}

                {/* Description */}
                {item.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Product URL */}
                {item.url && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Product Link
                    </h3>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="truncate">{getDomain(item.url)}</span>
                    </a>
                  </div>
                )}

                {/* Specifications */}
                {item.specifications && Object.keys(item.specifications).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                      Specifications
                    </h3>
                    <dl className="space-y-2">
                      {Object.entries(item.specifications).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start gap-3 text-sm"
                        >
                          <dt className="font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">
                            {key}:
                          </dt>
                          <dd className="text-gray-600 dark:text-gray-400 flex-1">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Notes
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      {item.notes}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <dl className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {item.created_by_user && (
                      <div>
                        <span>Added by {item.created_by_user.display_name}</span>
                      </div>
                    )}
                    {item.created_at && (
                      <div>
                        <span>Created on {formatShortDate(item.created_at)}</span>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <DialogFooter className="flex-col sm:flex-row gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
            {/* Left Actions */}
            <div className="flex gap-2">
              {canDelete && onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              {canEdit && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                Close
              </Button>
              {!item.is_purchased && canPurchase && onPurchase && (
                <Button
                  onClick={handlePurchase}
                  className="flex-1 sm:flex-none gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Mark as Purchased
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// ScrollArea Component (if not already in ui components)
// ============================================================================

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('overflow-y-auto', className)}
    {...props}
  >
    {children}
  </div>
));
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
