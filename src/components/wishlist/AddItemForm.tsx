/**
 * AddItemForm Component
 * Form for adding wishlist items with URL parsing and validation
 * Supports pasting product URLs to auto-fill details
 */

import * as React from 'react';
import { Plus, Link as LinkIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CreateItemRequest, ItemPriority } from '@/types/wishlist';
import { cn, isValidUrl } from '@/lib/utils';

// ============================================================================
// Component Props
// ============================================================================

export interface AddItemFormProps {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: CreateItemRequest) => Promise<void>;
  initialUrl?: string;
}

// ============================================================================
// Form State
// ============================================================================

interface FormData {
  title: string;
  description: string;
  price: string;
  currency: string;
  url: string;
  priority: ItemPriority;
  quantity: string;
  category: string;
  tags: string[];
}

const initialFormData: FormData = {
  title: '',
  description: '',
  price: '',
  currency: 'USD',
  url: '',
  priority: 'medium',
  quantity: '1',
  category: '',
  tags: [],
};

// ============================================================================
// AddItemForm Component
// ============================================================================

export const AddItemForm: React.FC<AddItemFormProps> = ({
  listId,
  isOpen,
  onClose,
  onSubmit,
  initialUrl,
}) => {
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isParsing, setIsParsing] = React.useState(false);
  const [tagInput, setTagInput] = React.useState('');

  // Initialize with URL if provided
  React.useEffect(() => {
    if (initialUrl && isOpen) {
      setFormData(prev => ({ ...prev, url: initialUrl }));
      handleParseUrl(initialUrl);
    }
  }, [initialUrl, isOpen]);

  // Reset form when closed
  React.useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setTagInput('');
    }
  }, [isOpen]);

  // ============================================================================
  // URL Parsing (Mock - would integrate with backend API)
  // ============================================================================

  const handleParseUrl = async (url: string) => {
    if (!isValidUrl(url)) return;

    setIsParsing(true);
    try {
      // TODO: Implement actual URL parsing API call
      // For now, just extract domain as category
      const domain = new URL(url).hostname.replace('www.', '');
      setFormData(prev => ({
        ...prev,
        category: domain.split('.')[0],
      }));
    } catch (error) {
      console.error('Error parsing URL:', error);
    } finally {
      setIsParsing(false);
    }
  };

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleUrlBlur = () => {
    if (formData.url && isValidUrl(formData.url)) {
      handleParseUrl(formData.url);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  // ============================================================================
  // Validation
  // ============================================================================

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.url && !isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL';
    }

    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = 'Please enter a valid price';
    }

    if (formData.quantity && isNaN(Number(formData.quantity))) {
      newErrors.quantity = 'Please enter a valid quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // Submit Handler
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const itemData: CreateItemRequest = {
        list_id: listId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        price: formData.price ? Number(formData.price) : undefined,
        currency: formData.currency,
        url: formData.url.trim() || undefined,
        priority: formData.priority,
        quantity: Number(formData.quantity) || 1,
        category: formData.category.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      await onSubmit(itemData);
      onClose();
    } catch (error) {
      console.error('Error adding item:', error);
      // Error handling would be done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Wishlist Item</DialogTitle>
            <DialogDescription>
              Add a new item to your wishlist. You can paste a product URL to auto-fill details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* URL Input with Parse Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="url">
                Product URL (optional)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/product"
                    value={formData.url}
                    onChange={(e) => handleChange('url', e.target.value)}
                    onBlur={handleUrlBlur}
                    className={cn('pl-10', errors.url && 'border-red-500')}
                    disabled={isParsing}
                  />
                </div>
                {formData.url && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleParseUrl(formData.url)}
                    disabled={isParsing || !isValidUrl(formData.url)}
                  >
                    {isParsing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Parse'
                    )}
                  </Button>
                )}
              </div>
              {errors.url && (
                <p className="text-xs text-red-600">{errors.url}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Title *
              </label>
              <Input
                id="title"
                placeholder="Product name"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={cn(errors.title && 'border-red-500')}
                required
              />
              {errors.title && (
                <p className="text-xs text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Add details about this item"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
                rows={3}
              />
            </div>

            {/* Price and Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium" htmlFor="price">
                  Price
                </label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  className={cn(errors.price && 'border-red-500')}
                />
                {errors.price && (
                  <p className="text-xs text-red-600">{errors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="currency">
                  Currency
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>

            {/* Priority and Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="priority">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value as ItemPriority)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="quantity">
                  Quantity
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  className={cn(errors.quantity && 'border-red-500')}
                />
                {errors.quantity && (
                  <p className="text-xs text-red-600">{errors.quantity}</p>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="category">
                Category
              </label>
              <Input
                id="category"
                placeholder="e.g., Electronics, Books, Toys"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="tags">
                Tags
              </label>
              <Input
                id="tags"
                placeholder="Press Enter to add tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
