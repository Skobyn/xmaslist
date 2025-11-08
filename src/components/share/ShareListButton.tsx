'use client';

import * as React from 'react';
import {
  Button,
  Modal,
  Stack,
  Text,
  TextInput,
  Group,
  CopyButton,
  ActionIcon,
  Tooltip,
  Alert,
  Switch,
} from '@mantine/core';
import {
  IconShare,
  IconCopy,
  IconCheck,
  IconLink,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { supabase } from '@/lib/supabase/client';

interface ShareListButtonProps {
  listId: string;
  listName: string;
  isPublic: boolean;
  guestAccessToken: string | null;
  onUpdate?: () => void;
}

/**
 * Share List Button Component
 *
 * Generates a read-only shareable link for a wishlist.
 * Users can toggle public sharing on/off.
 */
export function ShareListButton({
  listId,
  listName,
  isPublic: initialIsPublic,
  guestAccessToken,
  onUpdate,
}: ShareListButtonProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [isPublic, setIsPublic] = React.useState(initialIsPublic);
  const [updating, setUpdating] = React.useState(false);

  // Generate share URL
  const shareUrl = guestAccessToken
    ? `${window.location.origin}/share/${guestAccessToken}`
    : '';

  const handleTogglePublic = async (checked: boolean) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('lists')
        .update({ is_public: checked })
        .eq('id', listId);

      if (error) throw error;

      setIsPublic(checked);
      onUpdate?.();
    } catch (err) {
      console.error('Failed to update sharing settings:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Button
        variant="light"
        color="blue"
        leftSection={<IconShare size={18} />}
        onClick={open}
      >
        Share
      </Button>

      <Modal
        opened={opened}
        onClose={close}
        title={`Share "${listName}"`}
        size="md"
      >
        <Stack gap="md">
          {/* Public Sharing Toggle */}
          <Stack gap="xs">
            <Group justify="space-between">
              <div>
                <Text fw={600}>Public Sharing</Text>
                <Text size="sm" c="dimmed">
                  Allow anyone with the link to view this list
                </Text>
              </div>
              <Switch
                checked={isPublic}
                onChange={(e) => handleTogglePublic(e.currentTarget.checked)}
                disabled={updating}
                color="green"
                size="md"
              />
            </Group>
          </Stack>

          {/* Share Link */}
          {isPublic && shareUrl ? (
            <>
              <Alert
                icon={<IconInfoCircle size={18} />}
                color="blue"
                variant="light"
              >
                This is a read-only link. Others can view your list but cannot modify it.
              </Alert>

              <Stack gap="xs">
                <Text fw={600} size="sm">
                  Share Link
                </Text>
                <Group gap="xs">
                  <TextInput
                    value={shareUrl}
                    readOnly
                    style={{ flex: 1 }}
                    leftSection={<IconLink size={16} />}
                  />
                  <CopyButton value={shareUrl}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied!' : 'Copy link'}>
                        <ActionIcon
                          color={copied ? 'green' : 'blue'}
                          variant="filled"
                          onClick={copy}
                          size="lg"
                        >
                          {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
                <Text size="xs" c="dimmed">
                  Anyone with this link can view your wishlist items
                </Text>
              </Stack>
            </>
          ) : (
            <Alert color="gray" variant="light">
              Enable public sharing to generate a shareable link.
            </Alert>
          )}

          <Group justify="flex-end">
            <Button variant="subtle" onClick={close}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
