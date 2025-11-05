'use client';

import * as React from 'react';
import {
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
  Button,
  Title,
  Alert,
  Group,
  Box,
  Loader,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconMapPin, IconWorld } from '@tabler/icons-react';
import { supabase } from '@/lib/supabase/client';

interface CreateRetailerModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateRetailerModal({ opened, onClose, onSuccess }: CreateRetailerModalProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [websiteUrl, setWebsiteUrl] = React.useState('');
  const [logoUrl, setLogoUrl] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [fetchingLogo, setFetchingLogo] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFetchLogo = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL first');
      return;
    }

    setFetchingLogo(true);
    setError(null);

    try {
      // Extract domain from URL
      let domain = websiteUrl.trim();

      // Remove protocol
      domain = domain.replace(/^https?:\/\//, '');

      // Remove www.
      domain = domain.replace(/^www\./, '');

      // Remove path
      domain = domain.split('/')[0];

      // Use Clearbit Logo API
      const logo = `https://logo.clearbit.com/${domain}`;
      setLogoUrl(logo);
    } catch (err: any) {
      setError('Failed to fetch logo');
    } finally {
      setFetchingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a retailer name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be signed in to create a retailer');
      }

      const { error: insertError } = await supabase
        .from('locations')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          website_url: websiteUrl.trim() || null,
          logo_url: logoUrl.trim() || null,
          owner_id: user.id,
        });

      if (insertError) throw insertError;

      // Reset form
      setName('');
      setDescription('');
      setWebsiteUrl('');
      setLogoUrl('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create retailer');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setWebsiteUrl('');
    setLogoUrl('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconMapPin size={24} color="#EF4444" />
          <Title order={3} size={24} fw={700}>
            Create New Retailer
          </Title>
        </Group>
      }
      size="md"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Text c="dimmed">
            Add a store or retailer where you plan to shop for Christmas gifts.
          </Text>

          {error && (
            <Alert
              icon={<IconAlertCircle size={20} />}
              color="christmasRed"
              title="Error"
            >
              {error}
            </Alert>
          )}

          <TextInput
            label="Retailer Name"
            placeholder="e.g. Amazon, Target, Best Buy..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="md"
            required
            disabled={loading}
            leftSection={<IconMapPin size={18} />}
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Add notes about this retailer..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="md"
            disabled={loading}
            minRows={3}
            maxRows={5}
          />

          <TextInput
            label="Website URL (Optional)"
            placeholder="e.g. www.amazon.com, target.com..."
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            size="md"
            disabled={loading}
            leftSection={<IconWorld size={18} />}
            rightSection={
              fetchingLogo ? (
                <Loader size="xs" />
              ) : websiteUrl.trim() ? (
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={handleFetchLogo}
                  disabled={fetchingLogo}
                >
                  Fetch Logo
                </Button>
              ) : null
            }
            description="Enter the retailer's main website to automatically fetch their logo"
          />

          {logoUrl && (
            <Box>
              <Text size="sm" fw={500} mb="xs">
                Logo Preview
              </Text>
              <Box
                style={{
                  padding: '20px',
                  borderRadius: '8px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={logoUrl}
                  alt="Retailer logo"
                  style={{
                    maxWidth: '150px',
                    maxHeight: '80px',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            </Box>
          )}

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
              Create Retailer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
