import { createTheme, MantineColorsTuple } from '@mantine/core';

/**
 * Bold Festive Modern Theme
 * High-contrast Christmas design with geometric patterns
 *
 * Color Philosophy:
 * - Base: Deep charcoal (#1F2937) and pure white for maximum contrast
 * - Primary: Vibrant Christmas red (#EF4444) for CTAs and emphasis
 * - Secondary: Emerald green (#10B981) for success and Christmas vibes
 * - Accent: Gold (#F59E0B) for premium feel
 */

// Custom color tuples for Mantine (10 shades each)
const christmasRed: MantineColorsTuple = [
  '#FEE2E2', // 0 - lightest
  '#FECACA', // 1
  '#FCA5A5', // 2
  '#F87171', // 3
  '#EF4444', // 4 - primary
  '#DC2626', // 5
  '#B91C1C', // 6
  '#991B1B', // 7
  '#7F1D1D', // 8
  '#5F0F0F', // 9 - darkest
];

const emeraldGreen: MantineColorsTuple = [
  '#D1FAE5', // 0 - lightest
  '#A7F3D0', // 1
  '#6EE7B7', // 2
  '#34D399', // 3
  '#10B981', // 4 - primary
  '#059669', // 5
  '#047857', // 6
  '#065F46', // 7
  '#064E3B', // 8
  '#022C22', // 9 - darkest
];

const festiveGold: MantineColorsTuple = [
  '#FEF3C7', // 0 - lightest
  '#FDE68A', // 1
  '#FCD34D', // 2
  '#FBBF24', // 3
  '#F59E0B', // 4 - primary
  '#D97706', // 5
  '#B45309', // 6
  '#92400E', // 7
  '#78350F', // 8
  '#451A03', // 9 - darkest
];

const charcoal: MantineColorsTuple = [
  '#F9FAFB', // 0 - lightest (for backgrounds)
  '#F3F4F6', // 1
  '#E5E7EB', // 2
  '#D1D5DB', // 3
  '#9CA3AF', // 4
  '#6B7280', // 5
  '#4B5563', // 6
  '#374151', // 7
  '#1F2937', // 8 - primary dark
  '#111827', // 9 - darkest
];

export const mantineTheme = createTheme({
  /** Color scheme */
  primaryColor: 'christmasRed',
  colors: {
    christmasRed,
    emeraldGreen,
    festiveGold,
    charcoal,
  },

  /** Typography - Safe, readable fonts */
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2.5rem', lineHeight: '1.2', fontWeight: '800' },
      h2: { fontSize: '2rem', lineHeight: '1.3', fontWeight: '700' },
      h3: { fontSize: '1.5rem', lineHeight: '1.4', fontWeight: '700' },
      h4: { fontSize: '1.25rem', lineHeight: '1.5', fontWeight: '600' },
      h5: { fontSize: '1.125rem', lineHeight: '1.5', fontWeight: '600' },
      h6: { fontSize: '1rem', lineHeight: '1.5', fontWeight: '600' },
    },
  },

  /** Spacing */
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  /** Border radius - geometric feel */
  radius: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  defaultRadius: 'md',

  /** Shadows - minimal, only for depth when needed */
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  /** Other settings */
  white: '#FFFFFF',
  black: '#1F2937',

  /** Component defaults */
  components: {
    Button: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: 'all 200ms ease',
        },
      },
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: true,
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'xs',
        radius: 'md',
      },
    },
    Input: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
    },
  },

  /** Breakpoints */
  breakpoints: {
    xs: '36em',  // 576px
    sm: '48em',  // 768px
    md: '62em',  // 992px
    lg: '75em',  // 1200px
    xl: '88em',  // 1408px
  },
});
