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
  Button,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import {
  IconGift,
  IconMapPin,
  IconExternalLink,
  IconShoppingCart,
  IconStarFilled,
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase/client';

interface Item {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  price: number | null;
  quantity: number;
  size: string | null;
  is_top_choice: boolean;
  purchased_by: string | null;
  list_id: string;
}

interface Retailer {
  id: string;
  name: string;
  description: string | null;
  items: Item[];
}

export default function PublicUserSharePage() {
  const params = useParams();
  const [retailers, setRetailers] = React.useState<Retailer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [ownerEmail, setOwnerEmail] = React.useState<string>('');

  const userId = params.userId as string;

  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();

        if (userError) throw new Error('User not found');
        setOwnerEmail(userData.email || 'Someone');

        // Get all locations for this user
        const { data: locations, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });

        if (locationsError) throw locationsError;

        if (!locations || locations.length === 0) {
          setRetailers([]);
          setLoading(false);
          return;
        }

        // Get all lists for these locations
        const locationIds = locations.map(loc => loc.id);
        const { data: lists, error: listsError } = await supabase
          .from('lists')
          .select('id, location_id')
          .in('location_id', locationIds);

        if (listsError) throw listsError;

        // Get all items for these lists
        if (lists && lists.length > 0) {
          const listIds = lists.map(list => list.id);
          const { data: items, error: itemsError } = await supabase
            .from('items')
            .select('*')
            .in('list_id', listIds)
            .is('purchased_by', null) // Only show unpurchased items
            .order('is_top_choice', { ascending: false })
            .order('created_at', { ascending: false });

          if (itemsError) throw itemsError;

          // Group items by location
          const retailersWithItems: Retailer[] = locations.map(location => {
            const locationListIds = lists
              .filter(list => list.location_id === location.id)
              .map(list => list.id);

            const locationItems = (items || []).filter(item =>
              locationListIds.includes(item.list_id)
            );

            return {
              id: location.id,
              name: location.name,
              description: location.description,
              items: locationItems,
            };
          });

          // Only include retailers with items
          setRetailers(retailersWithItems.filter(r => r.items.length > 0));
        } else {
          setRetailers([]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  if (loading) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
        }}
      >
        <Stack align="center" gap="md">
          <Loader size="xl" color="christmasRed" />
          <Text c="white" size="lg">Loading Christmas wishlist...</Text>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <Container size="lg" py="xl">
          <Card p={60} radius="lg" withBorder style={{ textAlign: 'center' }}>
            <Stack align="center" gap="xl">
              <ThemeIcon size={80} radius="xl" color="red" variant="light">
                <IconGift size={40} />
              </ThemeIcon>
              <Stack gap="xs">
                <Title order={2} size={28} fw={700}>
                  Wishlist Not Found
                </Title>
                <Text c="dimmed" size="lg">
                  {error}
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Container>
      </Box>
    );
  }

  const totalItems = retailers.reduce((sum, r) => sum + r.items.length, 0);

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <Box
        className="festive-pattern"
        style={{
          background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
          padding: '60px 0',
        }}
      >
        <Container size="lg">
          <Stack align="center" gap="md">
            <Group gap="xs">
              <IconGift size={40} color="#EF4444" />
              <Text size="xl" c="white" fw={800}>XmasList</Text>
              <Badge
                size="lg"
                variant="gradient"
                gradient={{ from: 'christmasRed', to: 'emeraldGreen', deg: 45 }}
              >
                2025
              </Badge>
            </Group>
            <Title order={1} size={44} fw={800} c="white" ta="center">
              {ownerEmail.split('@')[0]}'s Christmas Wishlist
            </Title>
            <Text c="gray.3" size="lg" ta="center">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} across {retailers.length} {retailers.length === 1 ? 'retailer' : 'retailers'}
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        {retailers.length === 0 ? (
          <Card p={60} radius="lg" withBorder style={{ textAlign: 'center' }}>
            <Stack align="center" gap="xl">
              <ThemeIcon size={80} radius="xl" color="gray" variant="light">
                <IconShoppingCart size={40} />
              </ThemeIcon>
              <Stack gap="xs">
                <Title order={2} size={28} fw={700}>
                  No Items Yet
                </Title>
                <Text c="dimmed" size="lg">
                  This wishlist is empty or all items have been purchased!
                </Text>
              </Stack>
            </Stack>
          </Card>
        ) : (
          <Stack gap={60}>
            {retailers.map((retailer) => (
              <Box key={retailer.id}>
                {/* Retailer Section Header */}
                <Group gap="xs" mb="lg">
                  <ThemeIcon size={40} radius="md" color="christmasRed" variant="light">
                    <IconMapPin size={22} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Title order={2} size={28} fw={700}>
                      {retailer.name}
                    </Title>
                    <Text c="dimmed" size="sm">
                      {retailer.items.length} {retailer.items.length === 1 ? 'item' : 'items'}
                    </Text>
                  </Stack>
                </Group>

                {/* Items Grid */}
                <Grid gutter="lg">
                  {retailer.items.map((item) => (
                    <Grid.Col key={item.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                      <PublicItemCard item={item} />
                    </Grid.Col>
                  ))}
                </Grid>
              </Box>
            ))}
          </Stack>
        )}
      </Container>

      {/* Footer */}
      <Box
        style={{
          backgroundColor: 'white',
          borderTop: '1px solid #E5E7EB',
          padding: '40px 0',
          marginTop: '60px',
        }}
      >
        <Container size="lg">
          <Stack align="center" gap="md">
            <Text c="dimmed" size="sm" ta="center">
              Create your own Christmas wishlist at
            </Text>
            <Button
              component="a"
              href="/"
              color="christmasRed"
              size="lg"
              className="button-festive"
            >
              Get Started with XmasList
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

// ============================================
// PUBLIC ITEM CARD COMPONENT
// ============================================

function PublicItemCard({ item }: { item: Item }) {
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
        <Group gap="xs">
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
            color="christmasRed"
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
