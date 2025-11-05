/**
 * LocationGrid Component
 * Responsive grid layout for displaying location cards
 * Mobile-first design with auto-fit columns
 */

import * as React from 'react';
import { Plus } from 'lucide-react';
import { LocationCard, LocationCardSkeleton } from './LocationCard';
import { Button } from '@/components/ui/button';
import type { Location } from '@/types/wishlist';
import { cn } from '@/lib/utils';

// ============================================================================
// Component Props
// ============================================================================

export interface LocationGridProps {
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  onLocationEdit?: (location: Location) => void;
  onLocationDelete?: (location: Location) => void;
  onLocationArchive?: (location: Location) => void;
  onCreateLocation?: () => void;
  isLoading?: boolean;
  currentUserId?: string;
  emptyMessage?: string;
  className?: string;
}

// ============================================================================
// LocationGrid Component
// ============================================================================

export const LocationGrid: React.FC<LocationGridProps> = ({
  locations,
  onLocationSelect,
  onLocationEdit,
  onLocationDelete,
  onLocationArchive,
  onCreateLocation,
  isLoading = false,
  currentUserId,
  emptyMessage = 'No locations found. Create your first location to get started!',
  className,
}) => {
  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6',
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <LocationCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // ============================================================================
  // Empty State
  // ============================================================================

  if (locations.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Plus className="h-8 w-8 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Locations Yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {emptyMessage}
          </p>
          {onCreateLocation && (
            <Button onClick={onCreateLocation} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Location
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // Grid with Locations
  // ============================================================================

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6',
        className
      )}
    >
      {locations.map((location) => (
        <LocationCard
          key={location.id}
          location={location}
          onSelect={onLocationSelect}
          onEdit={onLocationEdit}
          onDelete={onLocationDelete}
          onArchive={onLocationArchive}
          isOwner={currentUserId === location.owner_id}
        />
      ))}

      {/* Add New Location Card */}
      {onCreateLocation && (
        <button
          onClick={onCreateLocation}
          className={cn(
            'flex flex-col items-center justify-center',
            'rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700',
            'min-h-[200px] p-6',
            'transition-all duration-300',
            'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2'
          )}
          aria-label="Create new location"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
            <Plus className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Add New Location
          </span>
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Auto-fit Grid Variant (for smaller cards)
// ============================================================================

export const LocationGridAutoFit: React.FC<LocationGridProps> = ({
  locations,
  isLoading,
  className,
  ...props
}) => {
  if (isLoading) {
    return (
      <div
        className={cn('grid gap-4 sm:gap-5 lg:gap-6', className)}
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <LocationCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (locations.length === 0) {
    return <LocationGrid locations={[]} isLoading={false} {...props} />;
  }

  return (
    <div
      className={cn('grid gap-4 sm:gap-5 lg:gap-6', className)}
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      }}
    >
      {locations.map((location) => (
        <LocationCard
          key={location.id}
          location={location}
          {...props}
          isOwner={props.currentUserId === location.owner_id}
        />
      ))}
    </div>
  );
};
