# Next.js Expert Skill

A comprehensive Claude Code skill for Next.js 13+ development, troubleshooting, and optimization.

## Features

- 🚀 **Quick Solutions**: Common issues and quick fixes
- 📚 **Comprehensive Guides**: Step-by-step tutorials for complex topics
- 🎨 **Design Patterns**: Proven patterns for scalable applications
- 🐛 **Troubleshooting**: Complete error reference with solutions
- ⚡ **Performance**: Optimization strategies and best practices
- 📦 **Templates**: Ready-to-use component templates
- 🛠️ **Scripts**: Validation and analysis tools

## Installation

This skill is automatically available in Claude Code. No installation required.

## Usage

Claude Code will automatically use this skill when you ask about:

- Building Next.js applications
- Debugging Next.js errors (hydration, routing, build errors)
- Optimizing Next.js performance
- Configuring Next.js settings
- Designing Next.js architectures
- Understanding App Router vs Pages Router

## Quick Start

### Ask for Help
```
How do I fix hydration errors in Next.js?
How do I optimize images in Next.js?
What's the difference between Server and Client Components?
```

### Get Templates
```
Create a Next.js server component for fetching data
Generate a Next.js API route with authentication
```

### Troubleshoot Issues
```
I'm getting "window is not defined" error
My Next.js build is failing
Images are not optimizing
```

## Directory Structure

```
.claude/skills/nextjs-expert/
├── SKILL.md                    # Main skill file (auto-loaded)
├── README.md                   # This file
├── docs/
│   ├── TROUBLESHOOTING.md     # Complete error reference
│   ├── DESIGN_PATTERNS.md     # Architecture patterns
│   └── PERFORMANCE.md         # Optimization guide
├── resources/
│   ├── templates/             # Component templates
│   │   ├── server-component.tsx
│   │   ├── client-component.tsx
│   │   ├── layout.tsx
│   │   └── api-route.ts
│   └── examples/              # Configuration examples
│       └── next.config.js
└── scripts/                   # Validation tools
    ├── validate-config.js
    └── analyze-bundle.sh
```

## Advanced Usage

### Validation Scripts

Check your Next.js configuration:
```bash
node .claude/skills/nextjs-expert/scripts/validate-config.js
```

Analyze bundle size:
```bash
./.claude/skills/nextjs-expert/scripts/analyze-bundle.sh
```

### Templates

Use templates as starting points:
- Server Component: `resources/templates/server-component.tsx`
- Client Component: `resources/templates/client-component.tsx`
- Layout: `resources/templates/layout.tsx`
- API Route: `resources/templates/api-route.ts`

### Documentation

Deep dive into specific topics:
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Error solutions
- [Design Patterns](docs/DESIGN_PATTERNS.md) - Architecture guidance
- [Performance](docs/PERFORMANCE.md) - Optimization strategies

## Coverage

### Next.js Versions
- ✅ Next.js 15.x (latest)
- ✅ Next.js 14.x
- ✅ Next.js 13.x (App Router)
- ⚠️ Next.js 12.x (Pages Router - limited support)

### Topics Covered

**Core Concepts:**
- App Router vs Pages Router
- Server Components vs Client Components
- Layouts and Templates
- Data Fetching Patterns
- Caching Strategies

**Features:**
- Image Optimization (next/image)
- Font Optimization (next/font)
- Metadata API
- Route Handlers (API Routes)
- Server Actions
- Middleware
- Streaming with Suspense

**Configuration:**
- next.config.js
- TypeScript
- Tailwind CSS
- Environment Variables

**Deployment:**
- Vercel Deployment
- Docker/Standalone
- Static Export
- Edge Runtime

**Performance:**
- Core Web Vitals
- Bundle Optimization
- Code Splitting
- Caching
- Database Optimization

## Contributing

This is a Claude Code skill. To improve it:

1. Edit files in `.claude/skills/nextjs-expert/`
2. Test with Claude Code
3. Share improvements with the team

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [Vercel Guides](https://vercel.com/guides)
- [Next.js Discord](https://discord.gg/nextjs)

## License

MIT
