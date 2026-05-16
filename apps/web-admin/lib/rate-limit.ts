/**
 * Rate Limiting Middleware using Redis
 * Provides protection against brute force attacks
 */

import Redis from 'ioredis';
import { NextResponse, NextRequest } from 'next/server';

// Initialize Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('error', (err) => {
    console.error('Redis client error:', err);
    // Continue without rate limiting if Redis is unavailable
});

// Configuration for different endpoints
interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
    message: string; // Error message
    skipSuccessfulRequests?: boolean;
}

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    // Authentication endpoints - strict limits
    '/api/auth/login': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 attempts
        message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
        skipSuccessfulRequests: true,
    },
    '/api/auth/register': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3, // 3 registrations
        message: 'Terlalu banyak percobaan registrasi. Coba lagi dalam 1 jam.',
        skipSuccessfulRequests: true,
    },
    '/api/auth/google/callback': {
        windowMs: 10 * 60 * 1000, // 10 minutes
        maxRequests: 10, // 10 requests
        message: 'Terlalu banyak percobaan OAuth. Coba lagi dalam 10 menit.',
    },
    // Config endpoints - moderate limits
    '/api/config': {
        windowMs: 1 * 60 * 1000, // 1 minute
        maxRequests: 30, // 30 requests
        message: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.',
    },
    // Upload endpoints - strict limits
    '/api/upload': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 20, // 20 uploads per hour
        message: 'Upload terlalu sering. Coba lagi dalam 1 jam.',
        skipSuccessfulRequests: true,
    },
};

/**
 * Get client identifier (IP address or user ID)
 */
function getClientId(request: NextRequest): string {
    // Try to get from headers (forwarded from proxy/load balancer)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    // Fall back to socket address
    return (request as any).ip || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Check if request should be rate limited
 */
async function checkRateLimit(
    clientId: string,
    endpoint: string,
    config: RateLimitConfig
): Promise<{
    allowed: boolean;
    remaining: number;
    retryAfter: number;
}> {
    try {
        const key = `rate-limit:${endpoint}:${clientId}`;
        const current = await redis.incr(key);

        // Set expiry on first request
        if (current === 1) {
            await redis.pexpire(key, config.windowMs);
        }

        const allowed = current <= config.maxRequests;
        const remaining = Math.max(0, config.maxRequests - current);
        const ttl = await redis.pttl(key); // Get remaining TTL in milliseconds

        return {
            allowed,
            remaining,
            retryAfter: Math.ceil(ttl / 1000), // Convert to seconds
        };
    } catch (error) {
        console.error('Rate limit check failed:', error);
        // If Redis fails, allow the request
        return {
            allowed: true,
            remaining: config.maxRequests,
            retryAfter: 0,
        };
    }
}

/**
 * Middleware factory for rate limiting
 */
export function createRateLimitMiddleware(endpoint: string) {
    const config = RATE_LIMIT_CONFIGS[endpoint];

    if (!config) {
        console.warn(`No rate limit config for ${endpoint}`);
        // Return passthrough middleware if no config
        return async (request: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) => {
            return handler(request);
        };
    }

    return async (request: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) => {
        const clientId = getClientId(request);
        const { allowed, remaining, retryAfter } = await checkRateLimit(clientId, endpoint, config);

        // Create response headers with rate limit info
        const headers = {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString(),
        };

        if (!allowed) {
            return NextResponse.json(
                { success: false, message: config.message },
                {
                    status: 429, // Too Many Requests
                    headers: {
                        ...headers,
                        'Retry-After': retryAfter.toString(),
                    },
                }
            );
        }

        // Call the actual handler
        const response = await handler(request);

        // Skip rate limit counter if request was successful (optional)
        if (config.skipSuccessfulRequests && response.status >= 200 && response.status < 300) {
            // Decrement counter on success
            try {
                const key = `rate-limit:${endpoint}:${clientId}`;
                await redis.decr(key);
            } catch (error) {
                console.error('Failed to decrement rate limit counter:', error);
            }
        }

        // Add rate limit headers to response
        Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
        });

        return response;
    };
}

/**
 * Easy-to-use decorator for API routes
 * Usage: wrap your POST/GET handler with this
 */
export async function withRateLimit(
    endpoint: string,
    request: NextRequest,
    handler: () => Promise<NextResponse>
): Promise<NextResponse> {
    const middleware = createRateLimitMiddleware(endpoint);
    return middleware(request, async () => handler());
}

/**
 * Reset rate limit for a specific client/endpoint
 * Useful for manual admin operations
 */
export async function resetRateLimit(endpoint: string, clientId: string): Promise<void> {
    try {
        const key = `rate-limit:${endpoint}:${clientId}`;
        await redis.del(key);
    } catch (error) {
        console.error('Failed to reset rate limit:', error);
        throw error;
    }
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(endpoint: string, clientId: string): Promise<any> {
    try {
        const config = RATE_LIMIT_CONFIGS[endpoint];
        if (!config) return null;

        const key = `rate-limit:${endpoint}:${clientId}`;
        const current = await redis.get(key);
        const ttl = await redis.pttl(key);

        return {
            endpoint,
            clientId,
            current: parseInt(current || '0'),
            max: config.maxRequests,
            remaining: Math.max(0, config.maxRequests - parseInt(current || '0')),
            windowMs: config.windowMs,
            resetIn: ttl > 0 ? Math.ceil(ttl / 1000) : 0,
        };
    } catch (error) {
        console.error('Failed to get rate limit status:', error);
        throw error;
    }
}

/**
 * Get all rate limits for reporting/debugging
 */
export async function getAllRateLimits(): Promise<Record<string, RateLimitConfig>> {
    return RATE_LIMIT_CONFIGS;
}

/**
 * Close Redis connection
 */
export function closeRedisConnection(): void {
    redis.disconnect();
}
