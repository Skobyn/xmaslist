#!/usr/bin/env node

/**
 * Next.js Configuration Validator
 *
 * Validates next.config.js for common issues and best practices
 * Usage: node scripts/validate-config.js
 */

const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(process.cwd(), 'next.config.js')
const WARNINGS = []
const ERRORS = []

function validateConfig() {
  console.log('🔍 Validating Next.js configuration...\n')

  // Check if config exists
  if (!fs.existsSync(CONFIG_PATH)) {
    ERRORS.push('next.config.js not found')
    printResults()
    return
  }

  // Load configuration
  let config
  try {
    delete require.cache[require.resolve(CONFIG_PATH)]
    config = require(CONFIG_PATH)
  } catch (error) {
    ERRORS.push(`Failed to load next.config.js: ${error.message}`)
    printResults()
    return
  }

  // Run validations
  checkImageConfig(config)
  checkOutputConfig(config)
  checkSecurityHeaders(config)
  checkCompilerConfig(config)
  checkExperimentalFeatures(config)
  checkEnvironmentVariables(config)
  checkWebpackConfig(config)

  printResults()
}

function checkImageConfig(config) {
  if (!config.images) {
    WARNINGS.push('No image configuration found. Consider adding image optimization settings.')
    return
  }

  // Check for deprecated domains
  if (config.images.domains && config.images.domains.length > 0) {
    WARNINGS.push('images.domains is deprecated. Use images.remotePatterns instead.')
  }

  // Check for unoptimized images
  if (config.images.unoptimized) {
    WARNINGS.push('Image optimization is disabled. This may impact performance.')
  }

  // Check formats
  if (!config.images.formats || !config.images.formats.includes('image/avif')) {
    WARNINGS.push('Consider adding AVIF format for better compression.')
  }

  // Check for SVG security
  if (config.images.dangerouslyAllowSVG && !config.images.contentSecurityPolicy) {
    ERRORS.push('dangerouslyAllowSVG is enabled without contentSecurityPolicy. This is a security risk.')
  }

  console.log('✓ Image configuration checked')
}

function checkOutputConfig(config) {
  if (config.output === 'export') {
    WARNINGS.push('Static export mode detected. Some features are not available:')
    WARNINGS.push('  - API routes')
    WARNINGS.push('  - Server-side rendering')
    WARNINGS.push('  - Image optimization')
    WARNINGS.push('  - Rewrites/redirects')

    if (!config.images?.unoptimized) {
      ERRORS.push('output: "export" requires images.unoptimized: true')
    }
  }

  console.log('✓ Output configuration checked')
}

function checkSecurityHeaders(config) {
  if (typeof config.headers !== 'function') {
    WARNINGS.push('No security headers configured. Consider adding:')
    WARNINGS.push('  - X-Content-Type-Options: nosniff')
    WARNINGS.push('  - X-Frame-Options: DENY')
    WARNINGS.push('  - X-XSS-Protection: 1; mode=block')
    WARNINGS.push('  - Content-Security-Policy')
    return
  }

  console.log('✓ Headers function found')
}

function checkCompilerConfig(config) {
  if (!config.compiler) {
    return
  }

  // Check removeConsole in production
  if (process.env.NODE_ENV === 'production' && !config.compiler.removeConsole) {
    WARNINGS.push('Consider removing console.logs in production with compiler.removeConsole')
  }

  console.log('✓ Compiler configuration checked')
}

function checkExperimentalFeatures(config) {
  if (!config.experimental) {
    return
  }

  // Check for experimental features
  const experimentalFeatures = Object.keys(config.experimental)
  if (experimentalFeatures.length > 0) {
    WARNINGS.push(`Experimental features enabled: ${experimentalFeatures.join(', ')}`)
    WARNINGS.push('Note: Experimental features may be unstable')
  }

  console.log('✓ Experimental features checked')
}

function checkEnvironmentVariables(config) {
  // Check for hardcoded secrets
  if (config.env) {
    Object.keys(config.env).forEach(key => {
      if (key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('token')) {
        WARNINGS.push(`Potential secret in env.${key}. Ensure it references process.env`)
      }
    })
  }

  // Check for NEXT_PUBLIC_ prefix
  if (config.publicRuntimeConfig) {
    WARNINGS.push('publicRuntimeConfig is deprecated. Use NEXT_PUBLIC_ prefix instead')
  }

  console.log('✓ Environment variables checked')
}

function checkWebpackConfig(config) {
  if (typeof config.webpack === 'function') {
    console.log('✓ Custom webpack configuration found')
  }
}

function printResults() {
  console.log('\n' + '='.repeat(50))

  if (ERRORS.length === 0 && WARNINGS.length === 0) {
    console.log('✅ Configuration is valid!\n')
    process.exit(0)
  }

  if (ERRORS.length > 0) {
    console.log('\n❌ Errors:')
    ERRORS.forEach(error => console.log(`  - ${error}`))
  }

  if (WARNINGS.length > 0) {
    console.log('\n⚠️  Warnings:')
    WARNINGS.forEach(warning => console.log(`  - ${warning}`))
  }

  console.log('\n' + '='.repeat(50) + '\n')

  if (ERRORS.length > 0) {
    process.exit(1)
  }
}

// Run validation
validateConfig()
