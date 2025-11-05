'use client';

import * as React from 'react';
import {
  Group,
  Button,
  Container,
  Menu,
  Avatar,
  Text,
  UnstyledButton,
  Burger,
  Drawer,
  Stack,
  Divider,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconGift,
  IconLogout,
  IconUser,
  IconSettings,
  IconBell,
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase/client';
import { AuthModal } from '@/components/auth/AuthModal';

interface FestiveHeaderProps {
  user?: any;
}

export function FestiveHeader({ user }: FestiveHeaderProps) {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [authModalOpened, { open: openAuthModal, close: closeAuthModal }] = useDisclosure(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    closeDrawer();
  };

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'white',
          borderBottom: '1px solid #E5E7EB',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <Container size="lg">
          <Group h={70} justify="space-between">
            {/* Logo */}
            <Group gap="xs">
              <IconGift size={32} color="#EF4444" />
              <Text size="xl" fw={800} style={{ letterSpacing: '-0.02em' }}>
                XmasList
              </Text>
              <Badge
                size="sm"
                variant="gradient"
                gradient={{ from: 'christmasRed', to: 'emeraldGreen', deg: 45 }}
              >
                2025
              </Badge>
            </Group>

            {/* Desktop Navigation */}
            <Group gap="md" visibleFrom="sm">
              {user ? (
                <>
                  {/* Notifications */}
                  <ActionIcon variant="subtle" size="lg" color="gray">
                    <IconBell size={20} />
                  </ActionIcon>

                  {/* User Menu */}
                  <Menu shadow="md" width={200} position="bottom-end">
                    <Menu.Target>
                      <UnstyledButton>
                        <Group gap="sm">
                          <Avatar color="christmasRed" radius="xl">
                            {user.email?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Text size="sm" fw={600} visibleFrom="sm">
                            {user.email?.split('@')[0]}
                          </Text>
                        </Group>
                      </UnstyledButton>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Label>Account</Menu.Label>
                      <Menu.Item leftSection={<IconUser size={16} />}>
                        Profile
                      </Menu.Item>
                      <Menu.Item leftSection={<IconSettings size={16} />}>
                        Settings
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<IconLogout size={16} />}
                        onClick={handleSignOut}
                      >
                        Sign out
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </>
              ) : (
                <Button
                  color="christmasRed"
                  size="md"
                  onClick={openAuthModal}
                  className="button-festive"
                >
                  Sign In
                </Button>
              )}
            </Group>

            {/* Mobile Menu Button */}
            <Burger
              opened={drawerOpened}
              onClick={toggleDrawer}
              hiddenFrom="sm"
              size="sm"
            />
          </Group>
        </Container>
      </header>

      {/* Mobile Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="xs"
        position="right"
        title={
          <Group gap="xs">
            <IconGift size={24} color="#EF4444" />
            <Text fw={700}>Menu</Text>
          </Group>
        }
      >
        <Stack gap="md">
          {user ? (
            <>
              <Group gap="sm">
                <Avatar color="christmasRed" radius="xl">
                  {user.email?.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text size="sm" fw={600}>
                    {user.email?.split('@')[0]}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {user.email}
                  </Text>
                </div>
              </Group>

              <Divider />

              <Button
                variant="subtle"
                leftSection={<IconUser size={18} />}
                justify="flex-start"
                fullWidth
              >
                Profile
              </Button>

              <Button
                variant="subtle"
                leftSection={<IconSettings size={18} />}
                justify="flex-start"
                fullWidth
              >
                Settings
              </Button>

              <Divider />

              <Button
                color="red"
                variant="light"
                leftSection={<IconLogout size={18} />}
                onClick={handleSignOut}
                fullWidth
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button
              color="christmasRed"
              size="lg"
              onClick={() => {
                closeDrawer();
                openAuthModal();
              }}
              fullWidth
              className="button-festive"
            >
              Sign In
            </Button>
          )}
        </Stack>
      </Drawer>

      {/* Auth Modal */}
      <AuthModal opened={authModalOpened} onClose={closeAuthModal} />
    </>
  );
}
