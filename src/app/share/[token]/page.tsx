'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Stack,
  Group,
  Box,
  Loader,
  Badge,
  Image,
  ThemeIcon,
  Alert,
  Button,
} from '@mantine/core';
import {
  IconShoppingCart,
  IconStarFilled,
  IconExternalLink,
  IconLock,
  IconAlertCircle,
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase/client';
import { FestiveHeader } from '@/components/layout/FestiveHeader';

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
  created_at: string;
}

interface List {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  guest_access_token: string | null;
  owner_id: string;
}

interface Location {
  id: string;
  name: string;
  description: string | null;
}

/**
 * Read-Only List Sharing Page
 * Access via: /share/{guest_access_token}
 *
 * This page displays a shared wishlist in read-only mode.
 * Users can view items but cannot modify anything.
 */
export default function SharedListPage() {
  const params = useParams();
  const [list, setList] = React.useState<List | null>(null);
  const [location, setLocation] = React.useState<Location | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const token = params.token as string;

  React.useEffect(() => {
    loadSharedList();
  }, [token]);

  const loadSharedList = async () => {
    setLoading(true);
    setError(null);

    try {
      // First, try to find by guest_access_token (individual list sharing)
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('*, locations(*)')
        .eq('guest_access_token', token)
        .eq('is_public', true)
        .single();

      // If not found as guest token, try as userId (share all)
      if (listError || !listData) {
        // Check if token is a valid user ID - redirect to /u/[userId]
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', token)
          .single();

        if (userData) {
          // Redirect to the user profile route
          window.location.href = `/u/${token}`;
          return;
        }

        setError('This list does not exist or is no longer shared.');
        setLoading(false);
        return;
      }

      setList(listData);
      setLocation(listData.locations);

      // Load items for this list
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('list_id', listData.id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (err) {
      console.error('Error loading shared list:', err);
      setError('Failed to load this shared list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box style={{ minHeight: '100vh' }}>
        <FestiveHeader />
        <Box
          style={{
            minHeight: 'calc(100vh - 70px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack align="center" gap="md">
            <Loader size="xl" color="christmasRed" />
            <Text c="dimmed" size="lg">Loading shared list...</Text>
          </Stack>
        </Box>
      </Box>
    );
  }

  if (error || !list) {
    return (
      <Box style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <FestiveHeader />
        <Container size="lg" py="xl">
          <Alert
            icon={<IconAlertCircle size={24} />}
            title="List Not Found"
            color="red"
            variant="light"
          >
            {error || 'This shared list could not be found.'}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <FestiveHeader />

      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Read-Only Banner */}
          <Alert
            icon={<IconLock size={20} />}
            title="Read-Only Shared List"
            color="blue"
            variant="light"
          >
            You're viewing a shared wishlist. You cannot modify items or mark them as purchased.
          </Alert>

          {/* List Header */}
          <Stack gap="xs">
            {location && (
              <Badge size="lg" color="gray" variant="light">
                {location.name}
              </Badge>
            )}
            <Title order={1} size={36} fw={800}>
              {list.name}
            </Title>
            {list.description && (
              <Text c="dimmed" size="lg">
                {list.description}
              </Text>
            )}
            <Group gap="xs">
              <Badge size="lg" color="emeraldGreen" variant="light">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Badge>
            </Group>
          </Stack>

          {/* Items Grid or Empty State */}
          {items.length === 0 ? (
            <Card p={60} radius="lg" withBorder style={{ textAlign: 'center' }}>
              <Stack align="center" gap="xl">
                <ThemeIcon size={80} radius="xl" color="gray" variant="light">
                  <IconShoppingCart size={40} />
                </ThemeIcon>
                <Stack gap="xs" align="center">
                  <Title order={2} size={28} fw={700}>
                    No Items Yet
                  </Title>
                  <Text c="dimmed" size="lg" maw={500}>
                    This list doesn't have any items yet.
                  </Text>
                </Stack>
              </Stack>
            </Card>
          ) : (
            <Grid gutter="lg">
              {items.map((item) => (
                <Grid.Col key={item.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                  <SharedItemCard item={item} />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

// ============================================
// SHARED ITEM CARD COMPONENT (Read-Only)
// ============================================

interface SharedItemCardProps {
  item: Item;
}

function SharedItemCard({ item }: SharedItemCardProps) {
  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        height: '100%',
        backgroundColor: 'white',
      }}
    >
      <Card.Section>
        {item.image_url ? (
          <Image
            src={item.image_url}
            height={200}
            alt={item.title}
            fit="cover"
          />
        ) : (
          <Box
            style={{
              height: 200,
              background: 'linear-gradient(135deg, #FEE2E2 0%, #DCFCE7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconShoppingCart size={60} color="#9CA3AF" />
          </Box>
        )}
      </Card.Section>

      <Stack gap="md" mt="md">
        <Group gap="xs" align="flex-start">
          {item.is_top_choice && (
            <IconStarFilled size={18} color="#F59E0B" />
          )}
          <Title order={4} size={16} fw={600} lineClamp={2} style={{ flex: 1 }}>
            {item.title}
          </Title>
        </Group>

        {item.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {item.description}
          </Text>
        )}

        {item.price && (
          <Text size="xl" fw={700} c="christmasRed">
            ${(item.price / 100).toFixed(2)}
          </Text>
        )}

        {/* Size and Quantity Badges */}
        <Group gap="xs">
          {item.size && (
            <Badge size="sm" color="gray" variant="light">
              Size: {item.size}
            </Badge>
          )}
          {item.quantity > 1 && (
            <Badge size="sm" color="gray" variant="light">
              Qty: {item.quantity}
            </Badge>
          )}
        </Group>

        {item.url && (
          <Button
            variant="light"
            color="gray"
            size="sm"
            rightSection={<IconExternalLink size={16} />}
            component="a"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
          >
            View Product
          </Button>
        )}
      </Stack>
    </Card>
  );
}
