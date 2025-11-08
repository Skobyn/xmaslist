'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Button,
  Grid,
  Card,
  Stack,
  Group,
  Box,
  Loader,
  Badge,
  ActionIcon,
  Image,
  Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconExternalLink,
  IconShoppingCart,
  IconStar,
  IconStarFilled,
  IconRefresh,
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase/client';
import { FestiveHeader } from '@/components/layout/FestiveHeader';
import { AddItemModal } from '@/components/items/AddItemModal';
import { EditItemModal } from '@/components/items/EditItemModal';

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
  purchased_by: string | null;
  created_at: string;
}

interface List {
  id: string;
  location_id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export default function RetailerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [retailer, setRetailer] = React.useState<Location | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addItemOpened, { open: openAddItem, close: closeAddItem }] = useDisclosure(false);
  const [editItemOpened, { open: openEditItem, close: closeEditItem }] = useDisclosure(false);
  const [selectedItem, setSelectedItem] = React.useState<Item | null>(null);

  const retailerId = params.id as string;

  // Load data function (user-isolated)
  const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (!user?.id) {
          setLoading(false);
          return;
        }

        // Load retailer (only if user owns it)
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq('id', retailerId)
          .eq('owner_id', user.id) // Ensure user owns this location
          .single();

        if (locationError) throw locationError;
        setRetailer(locationData);

        // Load items through lists (only from user's lists)
        const { data: lists, error: listsError } = await supabase
          .from('lists')
          .select('*')
          .eq('location_id', retailerId)
          .eq('owner_id', user.id); // Ensure user owns these lists

        if (listsError) throw listsError;

        if (lists && lists.length > 0) {
          const listIds = lists.map(list => list.id);
          const { data: itemsData, error: itemsError } = await supabase
            .from('items')
            .select('*')
            .in('list_id', listIds)
            .order('created_at', { ascending: false });

          if (itemsError) throw itemsError;
          setItems(itemsData || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
  };

  // Load data on mount
  React.useEffect(() => {
    loadData();
  }, [retailerId]);

  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    openEditItem();
  };

  if (loading) {
    return (
      <Box style={{ minHeight: '100vh' }}>
        <FestiveHeader user={user} />
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
            <Text c="dimmed" size="lg">Loading items...</Text>
          </Stack>
        </Box>
      </Box>
    );
  }

  if (!retailer) {
    return (
      <Box style={{ minHeight: '100vh' }}>
        <FestiveHeader user={user} />
        <Container size="lg" py="xl">
          <Text>Retailer not found</Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <FestiveHeader user={user} />

      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Back Button & Header */}
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs">
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={18} />}
                onClick={() => router.push('/')}
                color="gray"
              >
                Back to Retailers
              </Button>
              <Title order={1} size={36} fw={800}>
                {retailer.name}
              </Title>
              {retailer.description && (
                <Text c="dimmed" size="lg">
                  {retailer.description}
                </Text>
              )}
              <Group gap="xs">
                <Badge size="lg" color="emeraldGreen" variant="light">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </Badge>
              </Group>
            </Stack>

            <Button
              size="lg"
              color="christmasRed"
              leftSection={<IconPlus size={20} />}
              onClick={openAddItem}
              className="button-festive"
            >
              Add Item
            </Button>
          </Group>

          {/* Items Grid or Empty State */}
          {items.length === 0 ? (
            <Card p={60} radius="lg" withBorder style={{ textAlign: 'center' }}>
              <Stack align="center" gap="xl">
                <Box
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FEE2E2 0%, #DCFCE7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconShoppingCart size={40} color="#EF4444" />
                </Box>

                <Stack gap="xs" align="center">
                  <Title order={2} size={28} fw={700}>
                    No Items Yet
                  </Title>
                  <Text c="dimmed" size="lg" maw={500}>
                    Start adding products or wishlist links for {retailer.name}.
                  </Text>
                </Stack>

                <Button
                  size="xl"
                  color="christmasRed"
                  leftSection={<IconPlus size={24} />}
                  onClick={openAddItem}
                  className="button-festive"
                >
                  Add First Item
                </Button>
              </Stack>
            </Card>
          ) : (
            <Grid gutter="lg">
              {items.map((item) => (
                <Grid.Col key={item.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                  <ItemCard item={item} onEdit={handleEditItem} onRefresh={loadData} />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>

      {/* Add Item Modal */}
      <AddItemModal
        opened={addItemOpened}
        onClose={closeAddItem}
        retailerId={retailerId}
        onSuccess={loadData}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        opened={editItemOpened}
        onClose={closeEditItem}
        item={selectedItem}
        onSuccess={loadData}
      />
    </Box>
  );
}

// ============================================
// ITEM CARD COMPONENT
// ============================================

interface ItemCardProps {
  item: Item;
  onEdit?: (item: Item) => void;
  onRefresh?: () => void;
}

function ItemCard({ item, onEdit, onRefresh }: ItemCardProps) {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefreshPrice = async () => {
    if (!item.url) return;

    setRefreshing(true);
    try {
      const encodedUrl = encodeURIComponent(item.url);
      const response = await fetch(`/api/extract-metadata?url=${encodedUrl}`);

      if (!response.ok) throw new Error('Failed to fetch metadata');

      const result = await response.json();

      if (result.success && result.data) {
        const priceInCents = result.data.price ? Math.round(Number(result.data.price) * 100) : null;

        const { error } = await supabase
          .from('items')
          .update({
            title: result.data.title || item.title,
            description: result.data.description || item.description,
            image_url: result.data.image || item.image_url,
            price: priceInCents,
            last_price_check: new Date().toISOString(),
          })
          .eq('id', item.id);

        if (error) throw error;
        onRefresh?.();
      }
    } catch (err) {
      console.error('Failed to refresh price:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className="card-hover"
      style={{
        cursor: 'pointer',
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
        <Group justify="space-between" align="flex-start">
          <Group gap="xs" style={{ flex: 1 }}>
            {item.is_top_choice && (
              <IconStarFilled size={18} color="#F59E0B" />
            )}
            <Title order={4} size={16} fw={600} lineClamp={2} style={{ flex: 1 }}>
              {item.title}
            </Title>
          </Group>
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={16} />}
                onClick={() => onEdit?.(item)}
              >
                Edit
              </Menu.Item>
              {item.url && (
                <Menu.Item
                  leftSection={<IconRefresh size={16} />}
                  onClick={handleRefreshPrice}
                  disabled={refreshing}
                  color="emeraldGreen"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Price'}
                </Menu.Item>
              )}
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={16} />}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
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

        {item.last_price_check && (
          <Text size="xs" c="dimmed" ta="center">
            Updated {new Date(item.last_price_check).toLocaleDateString()}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
