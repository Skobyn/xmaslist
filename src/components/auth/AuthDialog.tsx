/**
 * AuthDialog Component
 * Authentication dialog with email/password and magic link login
 * Fully accessible with form validation
 */

import * as React from 'react';
import { Mail, Lock, User as UserIcon, Loader2, ArrowRight, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LoginRequest, RegisterRequest, User } from '@/types/wishlist';
import { cn } from '@/lib/utils';

// ============================================================================
// Component Props
// ============================================================================

export interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
  defaultMode?: 'login' | 'register' | 'magic-link';
}

// ============================================================================
// Form State
// ============================================================================

type AuthMode = 'login' | 'register' | 'magic-link' | 'magic-link-sent';

interface FormData {
  email: string;
  password: string;
  displayName: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  displayName?: string;
  general?: string;
}

// ============================================================================
// AuthDialog Component
// ============================================================================

export const AuthDialog: React.FC<AuthDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = 'login',
}) => {
  const [mode, setMode] = React.useState<AuthMode>(defaultMode);
  const [formData, setFormData] = React.useState<FormData>({
    email: '',
    password: '',
    displayName: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({ email: '', password: '', displayName: '' });
      setErrors({});
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // ============================================================================
  // Validation
  // ============================================================================

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
      return false;
    }
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      return false;
    }
    return true;
  };

  const validateDisplayName = (name: string): boolean => {
    if (!name) {
      setErrors(prev => ({ ...prev, displayName: 'Name is required' }));
      return false;
    }
    if (name.length < 2) {
      setErrors(prev => ({ ...prev, displayName: 'Name must be at least 2 characters' }));
      return false;
    }
    return true;
  };

  // ============================================================================
  // Submit Handlers
  // ============================================================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailValid = validateEmail(formData.email);
    const passwordValid = validatePassword(formData.password);

    if (!emailValid || !passwordValid) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement actual login API call
      const loginData: LoginRequest = {
        email: formData.email,
        password: formData.password,
      };

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (onSuccess) {
        onSuccess({
          id: '1',
          email: formData.email,
          display_name: 'User',
          email_verified: true,
          created_at: new Date().toISOString(),
        });
      }
      onClose();
    } catch (error) {
      setErrors({ general: 'Invalid email or password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailValid = validateEmail(formData.email);
    const passwordValid = validatePassword(formData.password);
    const nameValid = validateDisplayName(formData.displayName);

    if (!emailValid || !passwordValid || !nameValid) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement actual register API call
      const registerData: RegisterRequest = {
        email: formData.email,
        password: formData.password,
        display_name: formData.displayName,
      };

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (onSuccess) {
        onSuccess({
          id: '1',
          email: formData.email,
          display_name: formData.displayName,
          email_verified: false,
          created_at: new Date().toISOString(),
        });
      }
      onClose();
    } catch (error) {
      setErrors({ general: 'Registration failed. Email may already be in use.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateEmail(formData.email)) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement actual magic link API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMode('magic-link-sent');
    } catch (error) {
      setErrors({ general: 'Failed to send magic link' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' && 'Sign In'}
            {mode === 'register' && 'Create Account'}
            {mode === 'magic-link' && 'Magic Link Login'}
            {mode === 'magic-link-sent' && 'Check Your Email'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' && 'Sign in to your account to continue'}
            {mode === 'register' && 'Create a new account to get started'}
            {mode === 'magic-link' && 'We\'ll send you a magic link to sign in'}
            {mode === 'magic-link-sent' && 'We sent you a magic link to sign in'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'magic-link-sent' ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              We sent a magic link to <strong>{formData.email}</strong>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
              Click the link in your email to sign in. The link will expire in 15 minutes.
            </p>
            <Button
              variant="outline"
              onClick={() => setMode('magic-link')}
              className="w-full"
            >
              Send Another Link
            </Button>
          </div>
        ) : (
          <form
            onSubmit={
              mode === 'login'
                ? handleLogin
                : mode === 'register'
                ? handleRegister
                : handleMagicLink
            }
            className="space-y-4"
          >
            {/* Display Name (Register only) */}
            {mode === 'register' && (
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.displayName}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    className={cn('pl-10', errors.displayName && 'border-red-500')}
                    required
                  />
                </div>
                {errors.displayName && (
                  <p className="text-xs text-red-600">{errors.displayName}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={cn('pl-10', errors.email && 'border-red-500')}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password (Login and Register only) */}
            {mode !== 'magic-link' && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={cn('pl-10', errors.password && 'border-red-500')}
                    required
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600">{errors.password}</p>
                )}
              </div>
            )}

            {/* General Error */}
            {errors.general && (
              <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.general}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'magic-link' && (
                    <>
                      Send Magic Link
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </>
              )}
            </Button>

            {/* Mode Switching */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('magic-link')}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Use magic link instead
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="w-full text-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    Don't have an account? <strong>Sign up</strong>
                  </button>
                </>
              )}
              {mode === 'register' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Already have an account? <strong>Sign in</strong>
                </button>
              )}
              {mode === 'magic-link' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Use password instead
                </button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
