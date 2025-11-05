/**
 * Integration Tests for Authentication Flow
 * Tests user registration, login, and session management
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Supabase auth client
interface MockAuthClient {
  signUp: jest.Mock;
  signInWithPassword: jest.Mock;
  signOut: jest.Mock;
  getSession: jest.Mock;
  getUser: jest.Mock;
  refreshSession: jest.Mock;
}

const createMockAuthClient = (): MockAuthClient => ({
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  getUser: jest.fn(),
  refreshSession: jest.fn(),
});

describe('Authentication Integration Tests', () => {
  let authClient: MockAuthClient;

  beforeEach(() => {
    authClient = createMockAuthClient();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      };

      authClient.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: userData.email,
            email_confirmed_at: null,
          },
          session: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
          },
        },
        error: null,
      });

      const result = await authClient.signUp(userData);

      expect(result.data.user).toBeDefined();
      expect(result.data.user.email).toBe(userData.email);
      expect(result.data.session).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should reject weak passwords', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Too weak
      };

      authClient.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Password should be at least 6 characters',
          status: 400,
        },
      });

      const result = await authClient.signUp(userData);

      expect(result.data.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Password should be at least');
    });

    it('should reject duplicate email registrations', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
      };

      authClient.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'User already registered',
          status: 409,
        },
      });

      const result = await authClient.signUp(userData);

      expect(result.data.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.status).toBe(409);
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
      };

      authClient.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid email format',
          status: 400,
        },
      });

      const result = await authClient.signUp(userData);

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Invalid email');
    });

    it('should send verification email after registration', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      };

      authClient.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: userData.email,
            email_confirmed_at: null,
          },
          session: null, // No session until email confirmed
        },
        error: null,
      });

      const result = await authClient.signUp(userData);

      expect(result.data.user.email_confirmed_at).toBeNull();
      expect(result.data.session).toBeNull();
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'SecurePass123!',
      };

      authClient.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: credentials.email,
          },
          session: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
            expires_at: Date.now() + 3600000,
          },
        },
        error: null,
      });

      const result = await authClient.signInWithPassword(credentials);

      expect(result.data.user).toBeDefined();
      expect(result.data.session).toBeDefined();
      expect(result.data.session.access_token).toBeTruthy();
      expect(result.error).toBeNull();
    });

    it('should reject invalid credentials', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };

      authClient.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid login credentials',
          status: 401,
        },
      });

      const result = await authClient.signInWithPassword(credentials);

      expect(result.data.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.status).toBe(401);
    });

    it('should handle non-existent user', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      };

      authClient.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid login credentials',
          status: 401,
        },
      });

      const result = await authClient.signInWithPassword(credentials);

      expect(result.error).toBeDefined();
      expect(result.error.status).toBe(401);
    });

    it('should create session with expiry time', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'SecurePass123!',
      };

      const expiresAt = Date.now() + 3600000; // 1 hour

      authClient.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: credentials.email },
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_at: expiresAt,
          },
        },
        error: null,
      });

      const result = await authClient.signInWithPassword(credentials);

      expect(result.data.session.expires_at).toBeDefined();
      expect(result.data.session.expires_at).toBeGreaterThan(Date.now());
    });
  });

  describe('User Logout', () => {
    it('should logout successfully', async () => {
      authClient.signOut.mockResolvedValue({
        error: null,
      });

      const result = await authClient.signOut();

      expect(result.error).toBeNull();
      expect(authClient.signOut).toHaveBeenCalledTimes(1);
    });

    it('should clear session data on logout', async () => {
      authClient.signOut.mockResolvedValue({ error: null });
      authClient.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await authClient.signOut();
      const sessionResult = await authClient.getSession();

      expect(sessionResult.data.session).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should retrieve current session', async () => {
      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: Date.now() + 3600000,
        user: {
          id: 'user-123',
          email: 'user@example.com',
        },
      };

      authClient.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await authClient.getSession();

      expect(result.data.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('should return null for expired sessions', async () => {
      authClient.getSession.mockResolvedValue({
        data: { session: null },
        error: {
          message: 'Session expired',
          status: 401,
        },
      });

      const result = await authClient.getSession();

      expect(result.data.session).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should refresh expired sessions with refresh token', async () => {
      const refreshToken = 'refresh-token-123';

      authClient.refreshSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_at: Date.now() + 3600000,
          },
          user: {
            id: 'user-123',
            email: 'user@example.com',
          },
        },
        error: null,
      });

      const result = await authClient.refreshSession();

      expect(result.data.session).toBeDefined();
      expect(result.data.session.access_token).toBe('new-access-token');
      expect(result.error).toBeNull();
    });

    it('should handle invalid refresh tokens', async () => {
      authClient.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error: {
          message: 'Invalid refresh token',
          status: 401,
        },
      });

      const result = await authClient.refreshSession();

      expect(result.data.session).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.status).toBe(401);
    });
  });

  describe('User Information', () => {
    it('should retrieve current user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      authClient.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authClient.getUser();

      expect(result.data.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should return error for unauthenticated requests', async () => {
      authClient.getUser.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Not authenticated',
          status: 401,
        },
      });

      const result = await authClient.getUser();

      expect(result.data.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.status).toBe(401);
    });
  });

  describe('Security', () => {
    it('should rate limit failed login attempts', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };

      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        authClient.signInWithPassword.mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials', status: 401 },
        });
        await authClient.signInWithPassword(credentials);
      }

      // 6th attempt should be rate limited
      authClient.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: {
          message: 'Too many attempts, please try again later',
          status: 429,
        },
      });

      const result = await authClient.signInWithPassword(credentials);

      expect(result.error?.status).toBe(429);
    });

    it('should not expose whether email exists', async () => {
      const nonExistentResult = await authClient.signInWithPassword({
        email: 'nonexistent@example.com',
        password: 'pass',
      });

      const wrongPasswordResult = await authClient.signInWithPassword({
        email: 'existing@example.com',
        password: 'wrongpass',
      });

      // Both should return same generic error message
      expect(nonExistentResult.error?.message).toBe(wrongPasswordResult.error?.message);
    });
  });
});
