'use client';

import * as React from 'react';
import {
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Title,
  Alert,
  Group,
  Image,
  Box,
  Loader,
  Checkbox,
} from '@mantine/core';
import { IconAlertCircle, IconLink, IconShoppingCart, IconStar } from '@tabler/icons-react';
import { supabase } from '@/lib/supabase/client';

interface Item {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  price: number | null;
  quantity: number;
  size: string | null;
  is_top_choice: boolean;
}

interface EditItemModalProps {
  opened: boolean;
  onClose: () => void;
  item: Item | null;
  onSuccess?: () => void;
}

export function EditItemModal({ opened, onClose, item, onSuccess }: EditItemModalProps) {
  const [url, setUrl] = React.useState('');
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState<number | string>('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [quantity, setQuantity] = React.useState<number | string>(1);
  const [size, setSize] = React.useState('');
  const [isTopChoice, setIsTopChoice] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load item data when modal opens
  React.useEffect(() => {
    if (item && opened) {
      setUrl(item.url || '');
      setName(item.title);
      setDescription(item.description || '');
      setPrice(item.price ? (item.price / 100) : '');
      setImageUrl(item.image_url || '');
      setQuantity(item.quantity);
      setSize(item.size || '');
      setIsTopChoice(item.is_top_choice);
    }
  }, [item, opened]);

  const handleExtractMetadata = async () => {
    if (!url.trim()) {
      setError('Please enter a URL first');
      return;
    }

    setExtracting(true);
    setError(null);

    try {
      const encodedUrl = encodeURIComponent(url.trim());
      const response = await fetch(`/api/extract-metadata?url=${encodedUrl}`);

      if (!response.ok) {
        throw new Error('Failed to extract metadata');
      }

      const result = await response.json();

      // Auto-fill the form with extracted data
      if (result.success && result.data) {
        if (result.data.title) setName(result.data.title);
        if (result.data.description) setDescription(result.data.description);
        if (result.data.price) setPrice(result.data.price);
        if (result.data.image) setImageUrl(result.data.image);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to extract URL metadata');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter an item name');
      return;
    }

    if (!item) {
      setError('Item not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert price to cents if provided
      const priceInCents = price ? Math.round(Number(price) * 100) : null;

      // Update the item
      const { error: updateError } = await supabase
        .from('items')
        .update({
          title: name.trim(),
          description: description.trim() || null,
          url: url.trim() || null,
          image_url: imageUrl.trim() || null,
          price: priceInCents,
          quantity: Number(quantity) || 1,
          size: size.trim() || null,
          is_top_choice: isTopChoice,
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setName('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setQuantity(1);
    setSize('');
    setIsTopChoice(false);
    setError(null);
    onClose();
  };

  if (!item) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconShoppingCart size={24} color="#EF4444" />
          <Title order={3} size={24} fw={700}>
            Edit Item
          </Title>
        </Group>
      }
      size="lg"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          {error && (
            <Alert
              icon={<IconAlertCircle size={20} />}
              color="christmasRed"
              title="Error"
            >
              {error}
            </Alert>
          )}

          {/* URL Input */}
          <TextInput
            label="Product or Wishlist URL (Optional)"
            placeholder="https://www.amazon.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            size="md"
            disabled={loading}
            leftSection={<IconLink size={18} />}
            rightSection={
              extracting ? (
                <Loader size="xs" />
              ) : url.trim() ? (
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={handleExtractMetadata}
                  disabled={extracting}
                >
                  Extract
                </Button>
              ) : null
            }
          />

          {/* Item Name */}
          <TextInput
            label="Item Name"
            placeholder="e.g., PlayStation 5, LEGO Set, Winter Coat..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="md"
            required
            disabled={loading}
          />

          {/* Description */}
          <Textarea
            label="Description (Optional)"
            placeholder="Add notes about this item..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="md"
            disabled={loading}
            minRows={2}
            maxRows={4}
          />

          {/* Price, Quantity, and Size */}
          <Group grow>
            <NumberInput
              label="Price (Optional)"
              placeholder="29.99"
              value={price}
              onChange={setPrice}
              size="md"
              disabled={loading}
              min={0}
              decimalScale={2}
              prefix="$"
            />
            <NumberInput
              label="Quantity"
              value={quantity}
              onChange={setQuantity}
              size="md"
              disabled={loading}
              min={1}
              max={99}
            />
          </Group>

          {/* Size Field */}
          <TextInput
            label="Size (Optional)"
            placeholder="e.g., Medium, XL, 10.5, One Size..."
            value={size}
            onChange={(e) => setSize(e.target.value)}
            size="md"
            disabled={loading}
          />

          {/* Image URL */}
          <TextInput
            label="Image URL (Optional)"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            size="md"
            disabled={loading}
          />

          {/* Image Preview */}
          {imageUrl && (
            <Box>
              <Text size="sm" fw={500} mb="xs">
                Image Preview
              </Text>
              <Image
                src={imageUrl}
                height={120}
                fit="contain"
                radius="md"
                alt="Item preview"
              />
            </Box>
          )}

          {/* Top Choice Toggle */}
          <Checkbox
            label={
              <Group gap="xs">
                <IconStar size={18} color="#F59E0B" />
                <Text fw={600}>Mark as Top Choice</Text>
              </Group>
            }
            description="Highlight this item as a priority gift"
            checked={isTopChoice}
            onChange={(e) => setIsTopChoice(e.currentTarget.checked)}
            color="festiveGold"
            size="md"
            disabled={loading}
          />

          {/* Buttons */}
          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="christmasRed"
              loading={loading}
              className="button-festive"
            >
              Update Item
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
