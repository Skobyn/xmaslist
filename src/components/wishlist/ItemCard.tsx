/**
 * ItemCard Component
 * Displays wishlist item with image, title, price, and actions
 * Fully responsive with mobile-first design and accessibility features
 */

import * as React from 'react';
import {
  ExternalLink,
  MoreVertical,
  Edit2,
  Trash2,
  ShoppingCart,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { WishlistItem } from '@/types/wishlist';
import {
  cn,
  formatPrice,
  getDomain,
  getPriorityColor,
  getPriorityLabel,
} from '@/lib/utils';

// ============================================================================
// Component Props
// ============================================================================

export interface ItemCardProps {
  item: WishlistItem;
  onViewDetails?: (item: WishlistItem) => void;
  onEdit?: (item: WishlistItem) => void;
  onDelete?: (item: WishlistItem) => void;
  onPurchase?: (item: WishlistItem) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// ItemCard Component
// ============================================================================

export const ItemCard = React.forwardRef<HTMLDivElement, ItemCardProps>(
  (
    {
      item,
      onViewDetails,
      onEdit,
      onDelete,
      onPurchase,
      showActions = true,
      compact = false,
      className,
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    const [showActionsMenu, setShowActionsMenu] = React.useState(false);

    const handleCardClick = () => {
      if (onViewDetails) {
        onViewDetails(item);
      }
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onEdit) {
        onEdit(item);
      }
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete(item);
      }
    };

    const handlePurchase = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onPurchase) {
        onPurchase(item);
      }
    };

    const handleImageError = () => {
      setImageError(true);
    };

    return (
      <Card
        ref={ref}
        className={cn(
          'group relative flex flex-col overflow-hidden transition-all duration-300',
          'hover:shadow-xl hover:-translate-y-1',
          'cursor-pointer h-full',
          item.is_purchased && 'opacity-75',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Purchase Badge */}
        {item.is_purchased && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white shadow-sm">
              <Check className="h-3 w-3" />
              Purchased
            </span>
          </div>
        )}

        {/* Priority Badge */}
        {!item.is_purchased && (
          <div className="absolute top-2 right-2 z-10">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                getPriorityColor(item.priority)
              )}
            >
              {getPriorityLabel(item.priority)}
            </span>
          </div>
        )}

        {/* Image */}
        <div
          className={cn(
            'relative overflow-hidden bg-gray-100 dark:bg-gray-800',
            compact ? 'aspect-[4/3]' : 'aspect-square'
          )}
        >
          {!imageError && item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col">
          <CardHeader className={cn('pb-3', compact && 'p-3')}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle
                  className={cn(
                    'line-clamp-2',
                    compact ? 'text-sm' : 'text-base sm:text-lg'
                  )}
                >
                  {item.title}
                </CardTitle>
                {item.description && !compact && (
                  <CardDescription className="line-clamp-2 mt-1.5">
                    {item.description}
                  </CardDescription>
                )}
              </div>

              {/* Actions Menu */}
              {showActions && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity',
                      compact && 'h-6 w-6'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActionsMenu(!showActionsMenu);
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Item actions</span>
                  </Button>

                  {showActionsMenu && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-950">
                      <div className="py-1">
                        {onEdit && (
                          <button
                            onClick={handleEdit}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit Item
                          </button>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Product
                          </a>
                        )}
                        {onDelete && (
                          <button
                            onClick={handleDelete}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Item
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className={cn('pb-3 flex-1', compact && 'p-3 pt-0')}>
            {/* Price */}
            {item.price !== undefined && (
              <div className="mb-2">
                <p
                  className={cn(
                    'font-bold text-blue-600 dark:text-blue-400',
                    compact ? 'text-lg' : 'text-xl sm:text-2xl'
                  )}
                >
                  {formatPrice(item.price, item.currency)}
                </p>
              </div>
            )}

            {/* Source URL */}
            {item.url && !compact && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{getDomain(item.url)}</span>
              </div>
            )}

            {/* Quantity */}
            {item.quantity > 1 && (
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  Qty: {item.quantity}
                </span>
              </div>
            )}
          </CardContent>

          <CardFooter
            className={cn(
              'flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-gray-800',
              compact && 'p-3'
            )}
          >
            {/* Purchased Info */}
            {item.is_purchased && item.purchased_by && (
              <p className="text-xs text-gray-500 dark:text-gray-400 w-full">
                Purchased by {item.purchased_by}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size={compact ? 'sm' : 'default'}
                className="flex-1"
                onClick={handleCardClick}
              >
                View Details
              </Button>
              {!item.is_purchased && onPurchase && (
                <Button
                  size={compact ? 'sm' : 'default'}
                  className="flex-1 gap-2"
                  onClick={handlePurchase}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Mark Purchased
                </Button>
              )}
            </div>
          </CardFooter>
        </div>
      </Card>
    );
  }
);

ItemCard.displayName = 'ItemCard';

// ============================================================================
// Item Card Skeleton Loader
// ============================================================================

export const ItemCardSkeleton: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  return (
    <Card className="overflow-hidden h-full">
      {/* Image Skeleton */}
      <div
        className={cn(
          'bg-gray-200 animate-pulse dark:bg-gray-700',
          compact ? 'aspect-[4/3]' : 'aspect-square'
        )}
      />

      {/* Content Skeleton */}
      <CardHeader className={cn('pb-3', compact && 'p-3')}>
        <div className="space-y-2">
          <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
          {!compact && (
            <>
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn('pb-3', compact && 'p-3 pt-0')}>
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
      </CardContent>

      <CardFooter
        className={cn(
          'flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-gray-800',
          compact && 'p-3'
        )}
      >
        <div className="flex w-full gap-2">
          <div className="h-9 flex-1 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
          <div className="h-9 flex-1 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
        </div>
      </CardFooter>
    </Card>
  );
};
