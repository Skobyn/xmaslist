/**
 * LocationCard Component
 * Displays location information with member count, list count, and actions
 * Fully responsive with mobile-first design
 */

import * as React from 'react';
import { MapPin, Users, List, MoreVertical, Edit2, Trash2, Archive } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Location } from '@/types/wishlist';
import { cn, formatRelativeTime, pluralize } from '@/lib/utils';

// ============================================================================
// Component Props
// ============================================================================

export interface LocationCardProps {
  location: Location;
  onSelect?: (location: Location) => void;
  onEdit?: (location: Location) => void;
  onDelete?: (location: Location) => void;
  onArchive?: (location: Location) => void;
  isOwner?: boolean;
  className?: string;
}

// ============================================================================
// LocationCard Component
// ============================================================================

export const LocationCard = React.forwardRef<HTMLDivElement, LocationCardProps>(
  (
    {
      location,
      onSelect,
      onEdit,
      onDelete,
      onArchive,
      isOwner = false,
      className,
    },
    ref
  ) => {
    const [showActions, setShowActions] = React.useState(false);

    const handleCardClick = () => {
      if (onSelect) {
        onSelect(location);
      }
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onEdit) {
        onEdit(location);
      }
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete(location);
      }
    };

    const handleArchive = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onArchive) {
        onArchive(location);
      }
    };

    return (
      <Card
        ref={ref}
        className={cn(
          'group relative overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:-translate-y-1',
          'cursor-pointer',
          location.is_archived && 'opacity-60',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Archived Badge */}
        {location.is_archived && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-500 px-2 py-1 text-xs font-medium text-white">
              <Archive className="h-3 w-3" />
              Archived
            </span>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg line-clamp-1">
                  {location.name}
                </CardTitle>
                {location.owner && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    by {location.owner.display_name}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Menu - Only for owners */}
            {isOwner && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(!showActions);
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>

                {showActions && (
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-950">
                    <div className="py-1">
                      <button
                        onClick={handleEdit}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Location
                      </button>
                      <button
                        onClick={handleArchive}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Archive className="h-4 w-4" />
                        {location.is_archived ? 'Unarchive' : 'Archive'}
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Location
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {location.description && (
            <CardDescription className="line-clamp-2 mt-2">
              {location.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="pb-3">
          {/* Statistics */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>
                {location.member_count || 0}{' '}
                {pluralize('member', location.member_count || 0)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <List className="h-4 w-4" />
              <span>
                {location.list_count || 0}{' '}
                {pluralize('list', location.list_count || 0)}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Created {formatRelativeTime(location.created_at)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            onClick={handleCardClick}
          >
            View Lists →
          </Button>
        </CardFooter>
      </Card>
    );
  }
);

LocationCard.displayName = 'LocationCard';

// ============================================================================
// Location Card Skeleton Loader
// ============================================================================

export const LocationCardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse dark:bg-gray-700" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            </div>
          </div>
        </div>
        <div className="mt-2 space-y-2">
          <div className="h-3 w-full bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
          <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-4">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="h-3 w-28 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
      </CardFooter>
    </Card>
  );
};
