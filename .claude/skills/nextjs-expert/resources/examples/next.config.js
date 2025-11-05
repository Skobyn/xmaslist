/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================
  // COMPILER OPTIONS
  // ============================================

  // Use SWC compiler (default in Next.js 13+)
  swcMinify: true,

  // Compiler options
  compiler: {
    // Remove console in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,

    // Enable styled-components
    styledComponents: true,

    // Enable emotion
    emotion: true,

    // Remove React properties in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // ============================================
  // BUILD & OUTPUT
  // ============================================

  // Output mode
  // - 'standalone': Optimized for Docker/containerized deployments
  // - 'export': Static HTML export (no server)
  output: 'standalone',

  // Build directory
  distDir: '.next',

  // Generate build ID
  generateBuildId: async () => {
    // Return custom build ID (e.g., git commit hash)
    return process.env.GIT_HASH || 'development'
  },

  // ============================================
  // IMAGES
  // ============================================

  images: {
    // Image formats (avif is smaller but slower to encode)
    formats: ['image/avif', 'image/webp'],

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for different layouts
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Allowed remote domains (deprecated - use remotePatterns)
    domains: ['example.com', 'cdn.example.com'],

    // Preferred: Use remote patterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],

    // Disable image optimization for static export
    unoptimized: false,

    // Cache time for optimized images
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year

    // Allow SVG
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ============================================
  // REDIRECTS & REWRITES
  // ============================================

  async redirects() {
    return [
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true, // 308 permanent redirect
      },
      {
        source: '/blog/:slug',
        destination: '/posts/:slug',
        permanent: false, // 307 temporary redirect
      },
      {
        // Regex matching
        source: '/post/:slug(\\d{1,})',
        destination: '/posts/:slug',
        permanent: false,
      },
    ]
  },

  async rewrites() {
    return {
      // Proxy to external API
      beforeFiles: [
        {
          source: '/api/external/:path*',
          destination: 'https://external-api.com/:path*',
        },
      ],
      // Fallback rewrites
      fallback: [
        {
          source: '/:path*',
          destination: '/404',
        },
      ],
    }
  },

  // ============================================
  // HEADERS
  // ============================================

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Cache static assets
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API routes CORS
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },

  // ============================================
  // ENVIRONMENT VARIABLES
  // ============================================

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    API_URL: process.env.API_URL,
  },

  // Public runtime config (available client-side)
  publicRuntimeConfig: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Server runtime config (server-side only)
  serverRuntimeConfig: {
    SECRET_KEY: process.env.SECRET_KEY,
  },

  // ============================================
  // EXPERIMENTAL FEATURES
  // ============================================

  experimental: {
    // Enable server actions
    serverActions: true,

    // Optimize package imports
    optimizePackageImports: ['lodash', 'date-fns'],

    // Enable Turbopack (experimental)
    turbo: {
      // Turbopack configuration
    },

    // Optimize fonts
    optimizeFonts: true,

    // Enable PPR (Partial Prerendering)
    ppr: false,
  },

  // ============================================
  // TYPESCRIPT
  // ============================================

  typescript: {
    // Dangerously allow production builds with TypeScript errors
    ignoreBuildErrors: false,

    // Use TypeScript incremental mode
    tsconfigPath: './tsconfig.json',
  },

  // ============================================
  // ESLint
  // ============================================

  eslint: {
    // Directories to run ESLint on during build
    dirs: ['pages', 'app', 'components', 'lib'],

    // Dangerously allow production builds with ESLint errors
    ignoreDuringBuilds: false,
  },

  // ============================================
  // WEBPACK
  // ============================================

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack configuration

    // Add custom rule
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Modify aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }

    // Add plugins
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.CUSTOM_VAR': JSON.stringify(process.env.CUSTOM_VAR),
      })
    )

    return config
  },

  // ============================================
  // BUNDLE ANALYZER
  // ============================================

  // Uncomment to analyze bundle
  // bundleAnalyzer: {
  //   enabled: process.env.ANALYZE === 'true',
  // },

  // ============================================
  // OTHER OPTIONS
  // ============================================

  // Disable powered by header
  poweredByHeader: false,

  // Compress output
  compress: true,

  // Production source maps
  productionBrowserSourceMaps: false,

  // Development indicators
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],

  // Trailing slash
  trailingSlash: false,

  // Base path (for deploying to subdirectory)
  // basePath: '/subdirectory',

  // Asset prefix (for CDN)
  // assetPrefix: 'https://cdn.example.com',

  // React strict mode
  reactStrictMode: true,
}

// Export configuration
module.exports = nextConfig

// ============================================
// USAGE WITH PLUGINS
// ============================================

// Example with bundle analyzer
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// })
// module.exports = withBundleAnalyzer(nextConfig)

// Example with PWA
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   disable: process.env.NODE_ENV === 'development',
// })
// module.exports = withPWA(nextConfig)

// Example with MDX
// const withMDX = require('@next/mdx')()
// module.exports = withMDX(nextConfig)
