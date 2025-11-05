'use client';

import * as React from 'react';
import {
  Modal,
  Stack,
  Text,
  TextInput,
  Button,
  Title,
  Alert,
} from '@mantine/core';
import { IconMail, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { supabase } from '@/lib/supabase/client';

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AuthModal({ opened, onClose }: AuthModalProps) {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('Sending magic link to:', email);
      console.log('Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Magic link sent successfully:', data);
      setSent(true);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Failed to send magic link. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSent(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Title order={3} size={24} fw={700}>
          Sign in to XmasList
        </Title>
      }
      size="md"
      centered
    >
      {sent ? (
        // Success state
        <Stack gap="lg" py="md">
          <Alert
            icon={<IconCheck size={20} />}
            color="emeraldGreen"
            title="Check your email!"
          >
            We've sent a magic link to <strong>{email}</strong>. Click the link in the
            email to sign in.
          </Alert>

          <Text c="dimmed" size="sm">
            The link will expire in 1 hour. Didn't receive it? Check your spam folder
            or try again.
          </Text>

          <Button variant="light" onClick={handleClose}>
            Close
          </Button>
        </Stack>
      ) : (
        // Form state
        <form onSubmit={handleSignIn}>
          <Stack gap="lg">
            <Text c="dimmed">
              Enter your email address and we'll send you a magic link to sign in.
              No password needed!
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
              label="Email address"
              placeholder="your@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftSection={<IconMail size={18} />}
              size="md"
              required
              disabled={loading}
            />

            <Button
              type="submit"
              size="lg"
              color="christmasRed"
              loading={loading}
              fullWidth
              className="button-festive"
            >
              Send Magic Link
            </Button>

            <Text c="dimmed" size="xs" ta="center">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
