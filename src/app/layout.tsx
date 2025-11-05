import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { mantineTheme } from '@/theme/mantine';
import '@mantine/core/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'FamBamXmas - Your Christmas Wishlist Manager',
    template: '%s | FamBamXmas',
  },
  description: 'Create and manage your Christmas wishlists with ease',
  keywords: ['christmas', 'wishlist', 'gifts', 'holidays'],
  authors: [{ name: 'FamBamXmas Team' }],
  creator: 'FamBamXmas',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'FamBamXmas - Your Christmas Wishlist Manager',
    description: 'Create and manage your Christmas wishlists with ease',
    siteName: 'FamBamXmas',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FamBamXmas - Your Christmas Wishlist Manager',
    description: 'Create and manage your Christmas wishlists with ease',
    creator: '@fambamxmas',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={mantineTheme} defaultColorScheme="light">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
