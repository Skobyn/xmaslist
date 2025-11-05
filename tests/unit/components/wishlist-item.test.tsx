/**
 * Unit Tests for Wishlist Item Component
 * Tests rendering, interactions, and state management
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock WishlistItem Component
interface WishlistItemProps {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  url?: string;
  imageUrl?: string;
  isPurchased: boolean;
  priority: 'low' | 'medium' | 'high';
  onPurchase?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const WishlistItem: React.FC<WishlistItemProps> = ({
  id,
  title,
  description,
  price,
  currency = 'USD',
  url,
  imageUrl,
  isPurchased,
  priority,
  onPurchase,
  onDelete,
  onEdit,
}) => {
  return (
    <div data-testid={`wishlist-item-${id}`} className="wishlist-item">
      {imageUrl && (
        <img src={imageUrl} alt={title} data-testid="item-image" />
      )}
      <h3 data-testid="item-title">{title}</h3>
      {description && <p data-testid="item-description">{description}</p>}
      {price && (
        <span data-testid="item-price">
          {currency} {price.toFixed(2)}
        </span>
      )}
      <span data-testid="item-priority" className={`priority-${priority}`}>
        {priority}
      </span>
      <span data-testid="item-status" className={isPurchased ? 'purchased' : 'available'}>
        {isPurchased ? 'Purchased' : 'Available'}
      </span>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" data-testid="item-link">
          View Product
        </a>
      )}
      <div className="actions">
        {!isPurchased && onPurchase && (
          <button
            onClick={() => onPurchase(id)}
            data-testid="purchase-button"
          >
            Mark as Purchased
          </button>
        )}
        {onEdit && (
          <button onClick={() => onEdit(id)} data-testid="edit-button">
            Edit
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(id)} data-testid="delete-button">
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

describe('WishlistItem Component', () => {
  const defaultProps: WishlistItemProps = {
    id: 'item-123',
    title: 'Wireless Headphones',
    description: 'Noise-cancelling over-ear headphones',
    price: 299.99,
    currency: 'USD',
    url: 'https://amazon.com/product',
    imageUrl: 'https://example.com/image.jpg',
    isPurchased: false,
    priority: 'high',
  };

  describe('Rendering', () => {
    it('should render item with all props', () => {
      render(<WishlistItem {...defaultProps} />);

      expect(screen.getByTestId('item-title')).toHaveTextContent('Wireless Headphones');
      expect(screen.getByTestId('item-description')).toHaveTextContent('Noise-cancelling over-ear headphones');
      expect(screen.getByTestId('item-price')).toHaveTextContent('USD 299.99');
      expect(screen.getByTestId('item-priority')).toHaveTextContent('high');
    });

    it('should render image when imageUrl is provided', () => {
      render(<WishlistItem {...defaultProps} />);

      const image = screen.getByTestId('item-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(image).toHaveAttribute('alt', 'Wireless Headphones');
    });

    it('should not render image when imageUrl is not provided', () => {
      render(<WishlistItem {...defaultProps} imageUrl={undefined} />);

      expect(screen.queryByTestId('item-image')).not.toBeInTheDocument();
    });

    it('should render product link when url is provided', () => {
      render(<WishlistItem {...defaultProps} />);

      const link = screen.getByTestId('item-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://amazon.com/product');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should display correct purchased status', () => {
      const { rerender } = render(<WishlistItem {...defaultProps} isPurchased={false} />);
      expect(screen.getByTestId('item-status')).toHaveTextContent('Available');

      rerender(<WishlistItem {...defaultProps} isPurchased={true} />);
      expect(screen.getByTestId('item-status')).toHaveTextContent('Purchased');
    });

    it('should apply correct priority class', () => {
      const { rerender } = render(<WishlistItem {...defaultProps} priority="high" />);
      expect(screen.getByTestId('item-priority')).toHaveClass('priority-high');

      rerender(<WishlistItem {...defaultProps} priority="medium" />);
      expect(screen.getByTestId('item-priority')).toHaveClass('priority-medium');

      rerender(<WishlistItem {...defaultProps} priority="low" />);
      expect(screen.getByTestId('item-priority')).toHaveClass('priority-low');
    });
  });

  describe('User Interactions', () => {
    it('should call onPurchase when purchase button is clicked', () => {
      const onPurchase = jest.fn();
      render(<WishlistItem {...defaultProps} onPurchase={onPurchase} />);

      const purchaseButton = screen.getByTestId('purchase-button');
      fireEvent.click(purchaseButton);

      expect(onPurchase).toHaveBeenCalledTimes(1);
      expect(onPurchase).toHaveBeenCalledWith('item-123');
    });

    it('should call onDelete when delete button is clicked', () => {
      const onDelete = jest.fn();
      render(<WishlistItem {...defaultProps} onDelete={onDelete} />);

      const deleteButton = screen.getByTestId('delete-button');
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith('item-123');
    });

    it('should call onEdit when edit button is clicked', () => {
      const onEdit = jest.fn();
      render(<WishlistItem {...defaultProps} onEdit={onEdit} />);

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith('item-123');
    });

    it('should not show purchase button when item is already purchased', () => {
      const onPurchase = jest.fn();
      render(<WishlistItem {...defaultProps} isPurchased={true} onPurchase={onPurchase} />);

      expect(screen.queryByTestId('purchase-button')).not.toBeInTheDocument();
    });

    it('should not render action buttons when handlers are not provided', () => {
      render(<WishlistItem {...defaultProps} />);

      expect(screen.queryByTestId('purchase-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    });
  });

  describe('Price Formatting', () => {
    it('should format price with two decimal places', () => {
      render(<WishlistItem {...defaultProps} price={99} />);
      expect(screen.getByTestId('item-price')).toHaveTextContent('USD 99.00');
    });

    it('should handle different currencies', () => {
      const { rerender } = render(<WishlistItem {...defaultProps} currency="EUR" />);
      expect(screen.getByTestId('item-price')).toHaveTextContent('EUR 299.99');

      rerender(<WishlistItem {...defaultProps} currency="GBP" />);
      expect(screen.getByTestId('item-price')).toHaveTextContent('GBP 299.99');
    });

    it('should not render price when price is not provided', () => {
      render(<WishlistItem {...defaultProps} price={undefined} />);
      expect(screen.queryByTestId('item-price')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<WishlistItem
        {...defaultProps}
        onPurchase={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />);

      expect(screen.getByTestId('purchase-button')).toHaveTextContent('Mark as Purchased');
      expect(screen.getByTestId('edit-button')).toHaveTextContent('Edit');
      expect(screen.getByTestId('delete-button')).toHaveTextContent('Delete');
    });

    it('should have proper alt text for images', () => {
      render(<WishlistItem {...defaultProps} />);

      const image = screen.getByTestId('item-image');
      expect(image).toHaveAttribute('alt', 'Wireless Headphones');
    });

    it('should have secure external links', () => {
      render(<WishlistItem {...defaultProps} />);

      const link = screen.getByTestId('item-link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(200);
      render(<WishlistItem {...defaultProps} title={longTitle} />);

      expect(screen.getByTestId('item-title')).toHaveTextContent(longTitle);
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Test & Item <script>alert("xss")</script>';
      render(<WishlistItem {...defaultProps} title={specialTitle} />);

      expect(screen.getByTestId('item-title')).toHaveTextContent(specialTitle);
    });

    it('should handle zero price', () => {
      render(<WishlistItem {...defaultProps} price={0} />);
      expect(screen.getByTestId('item-price')).toHaveTextContent('USD 0.00');
    });

    it('should handle very large prices', () => {
      render(<WishlistItem {...defaultProps} price={999999.99} />);
      expect(screen.getByTestId('item-price')).toHaveTextContent('USD 999999.99');
    });
  });
});
