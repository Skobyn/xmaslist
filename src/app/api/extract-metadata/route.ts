/**
 * API Route: /api/extract-metadata
 * Extracts metadata from URLs with caching, rate limiting, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  BatchExtractMetadataRequest,
  ExtractMetadataResponse,
  ExtractMetadataError,
  BatchExtractMetadataResponse,
  ErrorCode,
} from '@/types/metadata';
import { extractMetadata } from '@/lib/metadata/metadata-extractor';
import { validateUrl } from '@/lib/metadata/url-validator';
import { getCache, getCacheStats } from '@/lib/metadata/cache';

// ============================================================================
// Rate Limiting (Simple In-Memory Implementation)
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

function checkRateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Use IP address or fallback to a default
  const forwarded = request.headers.get('x-forwarded-for');
  const ip: string = forwarded ? (forwarded.split(',')[0] ?? 'unknown') : (request.headers.get('x-real-ip') ?? 'unknown');
  return ip;
}

/**
 * Create error response
 */
function createErrorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number = 500,
  details?: string
): NextResponse<ExtractMetadataError> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      details,
    },
    { status: statusCode }
  );
}

/**
 * Parse request body safely
 */
async function parseRequestBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ============================================================================
// GET Handler - Single URL Extraction
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId);

    if (!rateLimit.allowed) {
      return createErrorResponse(
        'RATE_LIMIT' as ErrorCode,
        'Rate limit exceeded. Please try again later.',
        429,
        `Reset time: ${new Date(rateLimit.resetTime!).toISOString()}`
      );
    }

    // Get URL from query parameter
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return createErrorResponse(
        'INVALID_URL' as ErrorCode,
        'URL parameter is required',
        400
      );
    }

    // Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      return createErrorResponse(
        'INVALID_URL' as ErrorCode,
        validation.error || 'Invalid URL',
        400
      );
    }

    const normalizedUrl = validation.url!;

    // Check options
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    const includeRetailerData = searchParams.get('includeRetailerData') !== 'false';

    // Get cache instance
    const cache = getCache();
    const stats = getCacheStats();

    // Check cache (unless force refresh)
    let metadata;
    let cached = false;

    if (!forceRefresh) {
      metadata = await cache.get(normalizedUrl);
      if (metadata) {
        cached = true;
        stats.recordHit();
      } else {
        stats.recordMiss();
      }
    } else {
      stats.recordMiss();
    }

    // Extract metadata if not cached
    if (!metadata) {
      try {
        metadata = await extractMetadata(normalizedUrl, {
          includeRetailerData,
          useFallback: true,
          timeout: 10000,
        });

        // Cache the result
        await cache.set(normalizedUrl, metadata);
      } catch (error: any) {
        const errorCode = error.code || 'FETCH_FAILED';
        return createErrorResponse(
          errorCode as ErrorCode,
          error.message || 'Failed to extract metadata',
          error.statusCode || 500,
          error.details
        );
      }
    }

    const processingTime = Date.now() - startTime;

    const response: ExtractMetadataResponse = {
      success: true,
      data: metadata,
      cached,
      processingTime,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error: any) {
    console.error('Metadata extraction error:', error);
    return createErrorResponse(
      'SERVER_ERROR' as ErrorCode,
      'Internal server error',
      500,
      error.message
    );
  }
}

// ============================================================================
// POST Handler - Batch URL Extraction
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId);

    if (!rateLimit.allowed) {
      return createErrorResponse(
        'RATE_LIMIT' as ErrorCode,
        'Rate limit exceeded. Please try again later.',
        429,
        `Reset time: ${new Date(rateLimit.resetTime!).toISOString()}`
      );
    }

    // Parse request body
    const body = await parseRequestBody<BatchExtractMetadataRequest>(request);

    if (!body || !body.urls || !Array.isArray(body.urls)) {
      return createErrorResponse(
        'INVALID_URL' as ErrorCode,
        'Request body must contain an array of URLs',
        400
      );
    }

    const { urls, options = {} } = body;

    // Validate batch size
    if (urls.length === 0) {
      return createErrorResponse(
        'INVALID_URL' as ErrorCode,
        'URLs array cannot be empty',
        400
      );
    }

    if (urls.length > 10) {
      return createErrorResponse(
        'INVALID_URL' as ErrorCode,
        'Maximum 10 URLs allowed per batch request',
        400
      );
    }

    // Get cache instance
    const cache = getCache();
    const stats = getCacheStats();

    // Process URLs
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        // Validate URL
        const validation = validateUrl(url);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid URL');
        }

        const normalizedUrl = validation.url!;

        // Check cache
        let metadata;
        let cached = false;

        if (!options.forceRefresh) {
          metadata = await cache.get(normalizedUrl);
          if (metadata) {
            cached = true;
            stats.recordHit();
          } else {
            stats.recordMiss();
          }
        } else {
          stats.recordMiss();
        }

        // Extract if not cached
        if (!metadata) {
          metadata = await extractMetadata(normalizedUrl, {
            includeRetailerData: options.includeRetailerData,
            useFallback: true,
            timeout: options.timeout || 10000,
          });

          // Cache result
          await cache.set(normalizedUrl, metadata);
        }

        return {
          url,
          success: true,
          data: metadata,
          cached,
        };
      })
    );

    // Process results
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          url: urls[index],
          success: false,
          error: result.reason.message || 'Unknown error',
        };
      }
    });

    const successful = processedResults.filter((r) => r.success).length;
    const failed = processedResults.filter((r) => !r.success).length;
    const cached = processedResults.filter((r) => r.cached).length;
    const processingTime = Date.now() - startTime;

    const response: BatchExtractMetadataResponse = {
      success: successful > 0,
      results: processedResults,
      summary: {
        total: urls.length,
        successful,
        failed,
        cached,
        processingTime,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error: any) {
    console.error('Batch metadata extraction error:', error);
    return createErrorResponse(
      'SERVER_ERROR' as ErrorCode,
      'Internal server error',
      500,
      error.message
    );
  }
}

// ============================================================================
// OPTIONS Handler - CORS Support
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
