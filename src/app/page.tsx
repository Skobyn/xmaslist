'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
  ThemeIcon,
  List,
  Badge,
  Paper,
  Menu,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconGift,
  IconMapPin,
  IconLink,
  IconUsers,
  IconSparkles,
  IconDeviceMobile,
  IconPlus,
  IconShare,
  IconEdit,
  IconDotsVertical,
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase/client';
import type { Location } from '@/types/wishlist';
import { FestiveHeader } from '@/components/layout/FestiveHeader';
import { AuthModal } from '@/components/auth/AuthModal';
import { CreateRetailerModal } from '@/components/retailers/CreateRetailerModal';
import { EditRetailerModal } from '@/components/retailers/EditRetailerModal';
import { UserShareModal } from '@/components/share/UserShareModal';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Bold Festive Modern Home Page
 * High-contrast Christmas design with geometric patterns
 */
export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [authModalOpened, { open: openAuthModal, close: closeAuthModal }] = useDisclosure(false);
  const [createRetailerOpened, { open: openCreateRetailer, close: closeCreateRetailer }] = useDisclosure(false);
  const [editRetailerOpened, { open: openEditRetailer, close: closeEditRetailer }] = useDisclosure(false);
  const [shareOpened, { open: openShare, close: closeShare }] = useDisclosure(false);
  const [selectedRetailer, setSelectedRetailer] = React.useState<Location | null>(null);

  // Load locations when user changes
  React.useEffect(() => {
    if (user) {
      loadLocations();
    } else {
      setLocations([]);
      setLoading(false);
    }
  }, [user]);

  // Load user's locations
  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: Location) => {
    router.push(`/retailers/${location.id}`);
  };

  // Handle create new location
  const handleCreateLocation = () => {
    openCreateRetailer();
  };

  // Handle edit retailer
  const handleEditRetailer = (location: Location) => {
    setSelectedRetailer(location);
    openEditRetailer();
  };

  if (authLoading || loading) {
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
          <Text c="white" size="lg">Loading your Christmas lists...</Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box style={{ minHeight: '100vh' }}>
      <FestiveHeader />

      {!user ? (
        // ============================================
        // NOT AUTHENTICATED - WELCOME HERO SECTION
        // ============================================
        <Box>
          {/* Hero Section with Festive Pattern */}
          <Box
            className="festive-pattern"
            style={{
              background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
              paddingTop: '80px',
              paddingBottom: '80px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Container size="lg">
              <Stack align="center" gap="xl" className="animate-fade-in">
                {/* Christmas Badge */}
                <Badge
                  size="xl"
                  variant="gradient"
                  gradient={{ from: 'christmasRed', to: 'emeraldGreen', deg: 45 }}
                  leftSection={<IconSparkles size={18} />}
                >
                  Christmas 2025
                </Badge>

                {/* Main Heading */}
                <Title
                  order={1}
                  size={60}
                  fw={800}
                  ta="center"
                  c="white"
                  style={{
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Your Ultimate{' '}
                  <span className="text-gradient-festive">
                    Christmas Wishlist
                  </span>
                  {' '}Manager
                </Title>

                {/* Subtitle */}
                <Text
                  size="xl"
                  c="gray.3"
                  maw={600}
                  ta="center"
                  style={{ lineHeight: 1.6 }}
                >
                  Organize your holiday shopping by store, share lists with family,
                  and make this Christmas your most organized yet.
                </Text>

                {/* CTA Button */}
                <Button
                  size="xl"
                  radius="md"
                  color="christmasRed"
                  leftSection={<IconGift size={24} />}
                  className="button-festive animate-slide-in"
                  onClick={openAuthModal}
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    paddingLeft: '40px',
                    paddingRight: '40px',
                  }}
                >
                  Get Started - It's Free!
                </Button>
              </Stack>
            </Container>
          </Box>

          {/* Features Section */}
          <Container size="lg" py={80}>
            <Stack gap={60}>
              {/* Section Header */}
              <Stack align="center" gap="md">
                <Title order={2} size={40} fw={800} ta="center">
                  Everything You Need for{' '}
                  <span className="text-gradient-christmas">
                    Holiday Shopping
                  </span>
                </Title>
                <Text size="lg" c="dimmed" maw={600} ta="center">
                  Built for families who want to make Christmas shopping stress-free and fun
                </Text>
              </Stack>

              {/* Feature Cards */}
              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <FeatureCard
                    icon={<IconMapPin size={32} />}
                    title="Organize by Retailer"
                    description="Create cards for each store or retailer. Group your wishlist items by where you'll buy them."
                    color="christmasRed"
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <FeatureCard
                    icon={<IconLink size={32} />}
                    title="Auto-Extract Details"
                    description="Paste any product URL and we'll automatically extract the title, price, and image. No manual entry needed."
                    color="emeraldGreen"
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <FeatureCard
                    icon={<IconUsers size={32} />}
                    title="Family Sharing"
                    description="Share your wishlists with family and friends. They can mark items as purchased without spoiling the surprise."
                    color="festiveGold"
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <FeatureCard
                    icon={<IconGift size={32} />}
                    title="Purchase Privacy"
                    description="When someone marks an item as purchased, it's hidden from the list owner. Keep the magic alive!"
                    color="christmasRed"
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <FeatureCard
                    icon={<IconDeviceMobile size={32} />}
                    title="Mobile Friendly"
                    description="Shop on-the-go with our responsive design. Works perfectly on your phone while you're at the mall."
                    color="emeraldGreen"
                  />
                </Grid.Col>
              </Grid>

              {/* Final CTA */}
              <Paper
                p="xl"
                radius="lg"
                className="gradient-festive"
                style={{ border: 'none' }}
              >
                <Stack align="center" gap="lg">
                  <Title order={3} c="white" ta="center" size={32} fw={700}>
                    Ready to organize your Christmas?
                  </Title>
                  <Text c="white" size="lg" ta="center" maw={500}>
                    Sign in above with magic link authentication. No password needed!
                  </Text>
                </Stack>
              </Paper>
            </Stack>
          </Container>
        </Box>
      ) : (
        // ============================================
        // AUTHENTICATED - DASHBOARD
        // ============================================
        <Box style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
          <Container size="lg" py="xl">
            <Stack gap="xl">
              {/* Dashboard Header */}
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs">
                  <Title order={1} size={36} fw={800}>
                    Your Christmas Retailers
                  </Title>
                  <Text c="dimmed" size="lg">
                    Organize your wishlist by store or retailer
                  </Text>
                </Stack>

                <Group gap="sm">
                  <Button
                    size="lg"
                    color="emeraldGreen"
                    leftSection={<IconShare size={20} />}
                    onClick={openShare}
                    variant="light"
                  >
                    Share All
                  </Button>
                  <Button
                    size="lg"
                    color="christmasRed"
                    leftSection={<IconPlus size={20} />}
                    onClick={handleCreateLocation}
                    className="button-festive"
                  >
                    New Retailer
                  </Button>
                </Group>
              </Group>

              {/* Locations Grid or Empty State */}
              {locations.length === 0 ? (
                <Paper
                  p={60}
                  radius="lg"
                  withBorder
                  style={{
                    textAlign: 'center',
                    backgroundColor: 'white',
                  }}
                >
                  <Stack align="center" gap="xl">
                    <ThemeIcon size={80} radius="xl" color="gray" variant="light">
                      <IconMapPin size={40} />
                    </ThemeIcon>

                    <Stack gap="xs" align="center">
                      <Title order={2} size={28} fw={700}>
                        No Retailers Yet
                      </Title>
                      <Text c="dimmed" size="lg" maw={500}>
                        Create your first retailer card to start organizing your Christmas wishlist by store.
                      </Text>
                    </Stack>

                    <Button
                      size="xl"
                      color="christmasRed"
                      leftSection={<IconPlus size={24} />}
                      onClick={handleCreateLocation}
                      className="button-festive"
                    >
                      Create First Retailer
                    </Button>
                  </Stack>
                </Paper>
              ) : (
                <Grid gutter="lg">
                  {locations.map((location) => (
                    <Grid.Col key={location.id} span={{ base: 12, sm: 6, md: 4 }}>
                      <LocationCard
                        location={location}
                        onClick={() => handleLocationSelect(location)}
                        onEdit={() => handleEditRetailer(location)}
                      />
                    </Grid.Col>
                  ))}

                  {/* Add New Card */}
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Paper
                      p="xl"
                      radius="lg"
                      withBorder
                      onClick={handleCreateLocation}
                      style={{
                        cursor: 'pointer',
                        minHeight: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderStyle: 'dashed',
                        borderWidth: '2px',
                        borderColor: '#D1D5DB',
                        backgroundColor: 'white',
                        transition: 'all 200ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#EF4444';
                        e.currentTarget.style.backgroundColor = '#FEE2E2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#D1D5DB';
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <Stack align="center" gap="sm">
                        <ThemeIcon size={60} radius="xl" color="gray" variant="light">
                          <IconPlus size={30} />
                        </ThemeIcon>
                        <Text fw={600} c="dimmed">
                          Add New Retailer
                        </Text>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                </Grid>
              )}
            </Stack>
          </Container>
        </Box>
      )}

      {/* Auth Modal */}
      <AuthModal opened={authModalOpened} onClose={closeAuthModal} />

      {/* Create Retailer Modal */}
      <CreateRetailerModal
        opened={createRetailerOpened}
        onClose={closeCreateRetailer}
        onSuccess={loadLocations}
      />

      {/* Edit Retailer Modal */}
      <EditRetailerModal
        opened={editRetailerOpened}
        onClose={closeEditRetailer}
        retailer={selectedRetailer}
        onSuccess={loadLocations}
      />

      {/* Share Modal */}
      {user && (
        <UserShareModal
          opened={shareOpened}
          onClose={closeShare}
          userId={user.id}
        />
      )}
    </Box>
  );
}

// ============================================
// FEATURE CARD COMPONENT
// ============================================

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className="card-hover animate-fade-in"
      style={{ height: '100%', backgroundColor: 'white' }}
    >
      <Stack gap="md">
        <ThemeIcon size={60} radius="md" color={color} variant="light">
          {icon}
        </ThemeIcon>
        <Title order={3} size={20} fw={700}>
          {title}
        </Title>
        <Text c="dimmed" size="sm" style={{ lineHeight: 1.6 }}>
          {description}
        </Text>
      </Stack>
    </Card>
  );
}

// ============================================
// LOCATION CARD COMPONENT (Temporary)
// ============================================

interface LocationCardProps {
  location: Location;
  onClick: () => void;
  onEdit: () => void;
}

function LocationCard({ location, onClick, onEdit }: LocationCardProps) {
  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className="card-hover"
      style={{
        minHeight: '200px',
        backgroundColor: 'white',
        position: 'relative',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between">
          {(location as any).logo_url ? (
            <Box
              onClick={onClick}
              style={{
                width: 50,
                height: 50,
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#F9FAFB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                cursor: 'pointer',
              }}
            >
              <img
                src={(location as any).logo_url}
                alt={location.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          ) : (
            <ThemeIcon
              size={50}
              radius="md"
              color="christmasRed"
              variant="light"
              onClick={onClick}
              style={{ cursor: 'pointer' }}
            >
              <IconMapPin size={26} />
            </ThemeIcon>
          )}

          <Menu shadow="md" width={160} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                Edit Retailer
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Stack gap="xs" onClick={onClick} style={{ cursor: 'pointer' }}>
          <Title order={3} size={20} fw={700}>
            {location.name}
          </Title>
          {location.description && (
            <Text c="dimmed" size="sm" lineClamp={2}>
              {location.description}
            </Text>
          )}
        </Stack>

        <Group gap="xs" onClick={onClick} style={{ cursor: 'pointer' }}>
          <Badge size="sm" color="gray" variant="light">
            0 lists
          </Badge>
          <Badge size="sm" color="gray" variant="light">
            0 items
          </Badge>
        </Group>
      </Stack>
    </Card>
  );
}
