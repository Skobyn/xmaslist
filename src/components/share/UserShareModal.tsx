'use client';

import * as React from 'react';
import {
  Modal,
  Stack,
  Text,
  Button,
  Title,
  Alert,
  Group,
  TextInput,
  CopyButton,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconCheck, IconCopy, IconShare, IconAlertCircle } from '@tabler/icons-react';

interface UserShareModalProps {
  opened: boolean;
  onClose: () => void;
  userId: string;
}

export function UserShareModal({ opened, onClose, userId }: UserShareModalProps) {
  const [shareUrl, setShareUrl] = React.useState<string>('');
  const [isSharing, setIsSharing] = React.useState(false);

  React.useEffect(() => {
    if (opened && userId) {
      enablePublicSharing();
    }
  }, [opened, userId]);

  const enablePublicSharing = async () => {
    setIsSharing(true);
    try {
      // Import supabase dynamically
      const { supabase } = await import('@/lib/supabase/client');

      // Mark all user's lists as public for sharing
      const { error } = await supabase
        .from('lists')
        .update({ is_public: true })
        .eq('owner_id', userId);

      if (error) {
        console.error('Error enabling public sharing:', error);
      }

      // Generate share URL
      const url = `${window.location.origin}/u/${userId}`;
      setShareUrl(url);
    } catch (err) {
      console.error('Failed to enable sharing:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconShare size={24} color="#10B981" />
          <Title order={3} size={24} fw={700}>
            Share Your Wishlist
          </Title>
        </Group>
      }
      size="md"
      centered
    >
      <Stack gap="lg">
        <Text c="dimmed">
          Share this link with family and friends. They can view all your wishlists
          across all retailers without signing in. Items you mark as purchased will be
          hidden from the shared view.
        </Text>

        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Your Shareable Link
          </Text>
          <Group gap="xs">
            <TextInput
              value={shareUrl}
              readOnly
              size="md"
              style={{ flex: 1 }}
              onClick={(e) => e.currentTarget.select()}
            />
            <CopyButton value={shareUrl}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy link'}>
                  <ActionIcon
                    size="lg"
                    color={copied ? 'emeraldGreen' : 'gray'}
                    onClick={copy}
                  >
                    {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Stack>

        <Alert color="emeraldGreen" icon={<IconCheck size={20} />}>
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              What they'll see:
            </Text>
            <Text size="sm">
              ✓ All your retailers and items
              <br />
              ✓ Product details, prices, and images
              <br />
              ✓ Links to buy the items
              <br />
              ✗ Items marked as purchased (hidden)
            </Text>
          </Stack>
        </Alert>

        <Button onClick={handleClose} variant="light">
          Done
        </Button>
      </Stack>
    </Modal>
  );
}
