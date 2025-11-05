/**
 * Header Component
 * Application header with navigation, user menu, and responsive design
 */

import * as React from 'react';
import { Menu, X, Gift, Settings, LogOut, User as UserIcon, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/wishlist';
import { cn, getInitials } from '@/lib/utils';

// ============================================================================
// Component Props
// ============================================================================

export interface HeaderProps {
  user?: User;
  onLogin?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onProfileClick?: () => void;
  className?: string;
}

// ============================================================================
// Header Component
// ============================================================================

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  onSettings,
  onProfileClick,
  className,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-menu]')) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-800 dark:bg-gray-950/95',
        className
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Wishlist
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/" active>
              Locations
            </NavLink>
            <NavLink href="/lists">My Lists</NavLink>
            <NavLink href="/shared">Shared with Me</NavLink>
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                  <span className="sr-only">Notifications</span>
                </Button>

                {/* User Menu */}
                <div className="relative" data-menu>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <UserAvatar user={user} />
                    <span className="hidden lg:inline text-sm font-medium">
                      {user.display_name}
                    </span>
                  </Button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-950">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.display_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="py-1">
                        {onProfileClick && (
                          <button
                            onClick={() => {
                              onProfileClick();
                              setIsUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <UserIcon className="h-4 w-4" />
                            Profile
                          </button>
                        )}
                        {onSettings && (
                          <button
                            onClick={() => {
                              onSettings();
                              setIsUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Settings className="h-4 w-4" />
                            Settings
                          </button>
                        )}
                        {onLogout && (
                          <button
                            onClick={() => {
                              onLogout();
                              setIsUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Button onClick={onLogin}>Sign In</Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 py-4">
            <nav className="flex flex-col gap-2">
              <MobileNavLink href="/" active>
                Locations
              </MobileNavLink>
              <MobileNavLink href="/lists">My Lists</MobileNavLink>
              <MobileNavLink href="/shared">Shared with Me</MobileNavLink>
            </nav>

            {user ? (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <UserAvatar user={user} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.display_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {onProfileClick && (
                    <button
                      onClick={onProfileClick}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    >
                      <UserIcon className="h-4 w-4" />
                      Profile
                    </button>
                  )}
                  {onSettings && (
                    <button
                      onClick={onSettings}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  )}
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button onClick={onLogin} className="w-full">
                  Sign In
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

// ============================================================================
// User Avatar Component
// ============================================================================

const UserAvatar: React.FC<{ user: User; size?: 'sm' | 'md' | 'lg' }> = ({
  user,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.display_name}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size]
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-blue-600 font-medium text-white',
        sizeClasses[size]
      )}
    >
      {getInitials(user.display_name)}
    </div>
  );
};

// ============================================================================
// Navigation Link Components
// ============================================================================

interface NavLinkProps {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ href, active, children }) => (
  <a
    href={href}
    className={cn(
      'text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400',
      active
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-gray-600 dark:text-gray-400'
    )}
  >
    {children}
  </a>
);

const MobileNavLink: React.FC<NavLinkProps> = ({ href, active, children }) => (
  <a
    href={href}
    className={cn(
      'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
      active
        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    )}
  >
    {children}
  </a>
);
