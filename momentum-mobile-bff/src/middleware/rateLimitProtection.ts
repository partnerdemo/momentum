// Rate limit protection middleware to prevent BFF from being flagged by Cloudflare
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';

// Track request patterns to detect potential issues
// Using a Map with IP as key and an object containing per-endpoint counts
const requestPatterns = new Map<string, { timestamps: number[]; lastReset: number }>();
const PATTERN_WINDOW_MS = 60000; // 1 minute window
const MAX_REQUESTS_PER_MINUTE = 200; // Increased significantly - we trust our unified sync architecture

/**
 * List of path patterns to ALWAYS allow without rate limiting
 * These are critical auth flows that should never be blocked
 */
const ALWAYS_ALLOWED_PATHS = [
    '/auth/',        // All authentication routes
    '/health',       // Health checks
    '/debug',        // Debug endpoint
    '/onboarding',   // Onboarding flows
];

// Middleware to protect against excessive requests that might trigger rate limiting
export const rateLimitProtection = (req: Request, res: Response, next: NextFunction) => {
    // Determine key: Auth Token (if present) OR IP
    let clientKey: string;

    // Check for Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Securely hash the token to prevent token exposure in memory keys and logs
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        clientKey = `token:${hashedToken}`;
    } else {
        // Fallback to IP for unauthenticated requests
        const ip = String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || 'unknown');
        const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');
        clientKey = `ip:${hashedIp}`;
    }

    const endpoint = req.originalUrl;

    // Check whitelist FIRST - before any other processing
    const isWhitelisted = ALWAYS_ALLOWED_PATHS.some(pattern => endpoint.includes(pattern));
    if (isWhitelisted) {
        return next();
    }

    // Get or create pattern tracker for this Key
    const now = Date.now();
    let pattern = requestPatterns.get(clientKey);

    // If no pattern exists or window expired, create fresh
    if (!pattern || (now - pattern.lastReset) >= PATTERN_WINDOW_MS) {
        pattern = { timestamps: [now], lastReset: now };
        requestPatterns.set(clientKey, pattern);
        return next();
    }

    // Add current request timestamp
    pattern.timestamps.push(now);

    // Count only recent requests (within window)
    const recentCount = pattern.timestamps.filter(t => (now - t) < PATTERN_WINDOW_MS).length;

    // Check if over limit
    if (recentCount > MAX_REQUESTS_PER_MINUTE) {
        logger.warn(`[RATE LIMIT] Client exceeded ${MAX_REQUESTS_PER_MINUTE} requests/min`);
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
            status: 'error',
            message: 'Too many requests. Please slow down.',
            retryAfter: 60
        });
    }

    next();
};

// Cleanup function to prevent memory leaks - runs every 2 minutes
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [ip, pattern] of requestPatterns.entries()) {
        // Remove entries older than 2 windows
        if ((now - pattern.lastReset) > PATTERN_WINDOW_MS * 2) {
            requestPatterns.delete(ip);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        logger.debug(`[CLEANUP] Removed ${cleaned} stale rate limit entries`);
    }
}, 120000);
