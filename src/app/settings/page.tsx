'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Stack,
  Group,
  Box,
  TextInput,
  Divider,
  Alert,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconUser,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase/client';
import { FestiveHeader } from '@/components/layout/FestiveHeader';
import { useAuth } from '@/providers/AuthProvider';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [displayName, setDisplayName] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadUser = async () => {
      if (!user) {
        router.push('/');
        return;
      }

      // Load user profile from users table
      const { data: profile } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || '');
      }

      setLoading(false);
    };

    loadUser();
  }, [user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update or insert user profile
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          display_name: displayName.trim() || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (upsertError) throw upsertError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <FestiveHeader />
        <Container size="sm" py="xl">
          <Text>Loading...</Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <FestiveHeader />

      <Container size="sm" py="xl">
        <Stack gap="xl">
          {/* Back Button */}
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => router.push('/')}
            color="gray"
            w="fit-content"
          >
            Back to Dashboard
          </Button>

          {/* Page Header */}
          <Stack gap="xs">
            <Title order={1} size={36} fw={800}>
              Settings
            </Title>
            <Text c="dimmed" size="lg">
              Manage your profile and preferences
            </Text>
          </Stack>

          {/* Profile Settings Card */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <form onSubmit={handleSave}>
              <Stack gap="lg">
                <Group gap="xs">
                  <IconUser size={24} color="#EF4444" />
                  <Title order={2} size={24} fw={700}>
                    Profile
                  </Title>
                </Group>

                <Divider />

                {success && (
                  <Alert
                    icon={<IconCheck size={20} />}
                    color="emeraldGreen"
                    title="Success"
                  >
                    Your profile has been updated!
                  </Alert>
                )}

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
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  size="md"
                  description="Your email address cannot be changed"
                />

                <TextInput
                  label="Display Name"
                  placeholder="Enter your name (e.g., John Smith)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  size="md"
                  disabled={saving}
                  description="This name will appear when you share your wishlist with others"
                  leftSection={<IconUser size={18} />}
                />

                <Group justify="flex-end">
                  <Button
                    type="submit"
                    color="christmasRed"
                    loading={saving}
                    className="button-festive"
                  >
                    Save Changes
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>

          {/* Additional Settings Sections (Future) */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Title order={3} size={20} fw={700}>
                Privacy
              </Title>
              <Text c="dimmed" size="sm">
                Additional privacy settings coming soon...
              </Text>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
