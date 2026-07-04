import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

/**
 * Maps the incoming Web BFF URL path to the actual backend API relative path.
 * Handles special mappings for household links, store, and validate endpoints.
 */
export function mapBffPathToApiPath(pathname: string): string {
    // Strip '/web-bff' from the start
    let path = pathname.replace(/^\/web-bff/, '');

    // Predefined mappings for special cases:
    if (path.startsWith('/store')) {
        // Replace /store with /store-items
        path = path.replace(/^\/store/, '/store-items');
    } else if (path.startsWith('/household/links')) {
        // 1. /household/links/generate -> /household/child/generate-link-code
        if (path === '/household/links/generate') {
            return '/household/child/generate-link-code';
        }
        // 2. /household/links/link-existing -> /household/child/link-existing
        if (path === '/household/links/link-existing') {
            return '/household/child/link-existing';
        }
        // 3. /household/links/validate/:code -> /household/child/validate-code/:code
        if (path.startsWith('/household/links/validate/')) {
            const code = path.substring('/household/links/validate/'.length);
            return `/household/child/validate-code/${code}`;
        }
        // 4. /household/links/child/:childId/unlink -> /household/child/:childId/unlink
        if (path.startsWith('/household/links/child/')) {
            return path.replace('/household/links/child/', '/household/child/');
        }
        // 5. /household/links/:linkId/propose -> /household/link/:linkId/propose-change
        if (path.endsWith('/propose')) {
            const linkId = path.split('/')[3];
            return `/household/link/${linkId}/propose-change`;
        }
        // 6. /household/links/:linkId/approve/:changeId -> /household/link/${linkId}/approve-change/${changeId}
        if (path.includes('/approve/')) {
            const parts = path.split('/');
            const linkId = parts[3];
            const changeId = parts[5];
            return `/household/link/${linkId}/approve-change/${changeId}`;
        }
        // 7. /household/links/:linkId/reject/:changeId -> /household/link/${linkId}/reject-change/${changeId}
        if (path.includes('/reject/')) {
            const parts = path.split('/');
            const linkId = parts[3];
            const changeId = parts[5];
            return `/household/link/${linkId}/reject-change/${changeId}`;
        }
        // 8. /household/links/:linkId/settings -> /household/link/${linkId}/settings
        const parts = path.split('/');
        if (parts.length === 5 && parts[4] === 'settings') {
            const linkId = parts[3];
            return `/household/link/${linkId}/settings`;
        }
    } else if (path.startsWith('/pin/')) {
        // Special mappings for PIN-related operations to match backend API paths
        if (path === '/pin/verify') {
            return '/pin/verify-pin';
        }
        if (path === '/pin/setup') {
            return '/pin/setup-pin';
        }
        if (path === '/pin/change') {
            return '/pin/change-pin';
        }
        if (path === '/pin/status') {
            return '/pin/pin-status';
        }
    }

    return path;
}

interface ProxyOptions {
    isPublic?: boolean;
    overridePath?: string;
    mapPath?: (pathname: string, req: Request) => string | Promise<string>;
}

/**
 * Creates standard HTTP method handlers that proxy requests to the backend Core API.
 */
export function createProxyHandler(options: ProxyOptions = {}) {
    const handle = async (req: Request, context?: { params?: Record<string, string | string[]> }) => {
        try {
            const url = new URL(req.url);
            const headersList = headers();
            const authorization = headersList.get('authorization');

            // Dev Mode: Auto-intercept public authentication routes to ensure seamless local login
            if (process.env.NODE_ENV === 'development') {
                const bffPath = url.pathname;
                if (bffPath === '/web-bff/auth/login' || 
                    bffPath === '/web-bff/auth/signup' || 
                    bffPath === '/web-bff/auth/google' || 
                    bffPath === '/web-bff/auth/google/authenticate') {
                    
                    console.log(`[BFF Proxy] Dev Mode: Intercepting ${bffPath} and returning mock authentication`);
                    return NextResponse.json({
                        status: 'success',
                        token: 'mock_development_token',
                        data: {
                            user: {
                                _id: 'mock-parent-id-1',
                                firstName: 'Sarah',
                                role: 'Parent',
                            },
                            householdId: 'mock-household-id',
                            needsOnboarding: false
                        }
                    });
                }

                if (bffPath === '/web-bff/auth/me') {
                    console.log(`[BFF Proxy] Dev Mode: Intercepting ${bffPath} and returning mock session`);
                    return NextResponse.json({
                        status: 'success',
                        data: {
                            user: {
                                _id: 'mock-parent-id-1',
                                firstName: 'Sarah',
                                role: 'Parent',
                            },
                            householdId: 'mock-household-id'
                        }
                    });
                }

                if (bffPath === '/web-bff/auth/onboarding/complete') {
                    console.log(`[BFF Proxy] Dev Mode: Intercepting ${bffPath} and returning mock onboarding completion`);
                    return NextResponse.json({
                        status: 'success',
                        message: 'Onboarding completed'
                    });
                }
            }

            // 1. Determine if this path is public
            const isPublic = options.isPublic ||
                             url.pathname.includes('/auth/login') ||
                             url.pathname.includes('/auth/signup') ||
                             url.pathname.includes('/auth/google');

            // 2. Enforce authorization for private routes
            if (!authorization && !isPublic) {
                return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
            }

            // Dev Mock Token Interceptor
            if (authorization === 'Bearer mock_development_token') {
                const bffPath = url.pathname;
                
                // Mock Calendar Events
                if (bffPath === '/web-bff/calendar/google/events') {
                    const today = new Date();
                    const ymd = today.toLocaleDateString('en-CA'); // YYYY-MM-DD
                    
                    const mockEvents = [
                        {
                            id: 'mock-evt-1',
                            summary: '☀️ Morning Check-in & Routines',
                            start: { dateTime: `${ymd}T08:30:00` },
                            end: { dateTime: `${ymd}T09:00:00` },
                            location: 'Kitchen Island',
                            attendees: [
                                { email: 'sarah.panda@example.com', displayName: 'Sarah' },
                                { email: 'leo@example.com', displayName: 'Leo' },
                                { email: 'maya@example.com', displayName: 'Maya' }
                            ]
                        },
                        {
                            id: 'mock-evt-2',
                            summary: '🍱 Lunch & Free Play',
                            start: { dateTime: `${ymd}T12:00:00` },
                            end: { dateTime: `${ymd}T13:00:00` },
                            location: 'Dining Room',
                            attendees: [
                                { email: 'leo@example.com', displayName: 'Leo' },
                                { email: 'maya@example.com', displayName: 'Maya' }
                            ]
                        },
                        {
                            id: 'mock-evt-3',
                            summary: '🥋 Leo\'s Karate Practice',
                            start: { dateTime: `${ymd}T16:00:00` },
                            end: { dateTime: `${ymd}T17:30:00` },
                            location: 'Dojo Center',
                            attendees: [
                                { email: 'mark.panda@example.com', displayName: 'Mark' },
                                { email: 'leo@example.com', displayName: 'Leo' }
                            ]
                        },
                        {
                            id: 'mock-evt-4',
                            summary: '🍕 Family Pizza & Movie Night',
                            start: { dateTime: `${ymd}T18:30:00` },
                            end: { dateTime: `${ymd}T21:00:00` },
                            location: 'Living Room',
                            attendees: [
                                { email: 'sarah.panda@example.com', displayName: 'Sarah' },
                                { email: 'mark.panda@example.com', displayName: 'Mark' },
                                { email: 'leo@example.com', displayName: 'Leo' },
                                { email: 'maya@example.com', displayName: 'Maya' }
                            ]
                        }
                    ];
                    return NextResponse.json({ status: 'success', data: { events: mockEvents } });
                }

                // Mock PIN Verification
                if (bffPath === '/web-bff/pin/verify') {
                    return NextResponse.json({ verified: true });
                }

                // Mock PIN Setup
                if (bffPath === '/web-bff/pin/setup') {
                    return NextResponse.json({ success: true });
                }

                // Mock Task Completion
                if (bffPath.startsWith('/web-bff/tasks/') && bffPath.endsWith('/complete')) {
                    return NextResponse.json({ status: 'success', message: 'Task marked complete' });
                }

                // Mock Store Item Purchase
                if (bffPath.startsWith('/web-bff/store/') && bffPath.endsWith('/purchase')) {
                    return NextResponse.json({ status: 'success', message: 'Item purchased' });
                }
            }

            // 3. Resolve the backend API relative path
            let relativePath = '';
            if (options.overridePath) {
                relativePath = options.overridePath;
            } else if (options.mapPath) {
                relativePath = await options.mapPath(url.pathname, req);
            } else {
                relativePath = mapBffPathToApiPath(url.pathname);
            }

            // 4. Construct target API URL
            const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
            const targetUrl = new URL(`${base}${relativePath}${url.search}`);

            // 5. Read body if present for write methods
            let body: any = undefined;
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                try {
                    const contentType = req.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        // Clone the request so we don't lock it if someone else needs to read it
                        body = await req.clone().json();
                    }
                } catch {
                    // Ignore body parsing errors for empty bodies
                }
            }

            // 6. Build headers to forward
            const forwardHeaders: Record<string, string> = {};
            if (authorization) {
                forwardHeaders['Authorization'] = authorization;
            }
            const contentType = req.headers.get('content-type');
            if (contentType) {
                forwardHeaders['Content-Type'] = contentType;
            }

            // 7. Make API request
            const apiResponse = await fetch(targetUrl.toString(), {
                method: req.method,
                headers: forwardHeaders,
                body: body ? JSON.stringify(body) : undefined,
                cache: 'no-store'
            });

            // 8. Handle 204 No Content
            if (apiResponse.status === 204) {
                return new NextResponse(null, { status: 204 });
            }

            // 9. Check response content-type to safely handle HTML or text error pages
            const responseContentType = apiResponse.headers.get('content-type') || '';
            if (responseContentType.includes('application/json')) {
                const data = await apiResponse.json();
                return NextResponse.json(data, { status: apiResponse.status });
            } else {
                const errorText = await apiResponse.text();
                console.warn(`[BFF Proxy] Core API returned non-JSON response (${apiResponse.status}):`, errorText.substring(0, 200));
                return NextResponse.json(
                    { 
                        status: 'error', 
                        message: `Core API returned an invalid response format (Status: ${apiResponse.status})`,
                        error: errorText.substring(0, 500)
                    }, 
                    { status: apiResponse.status }
                );
            }

        } catch (err: any) {
            console.error(`[BFF Proxy Error] ${req.method} ${req.url}:`, err);
            return NextResponse.json(
                { message: 'BFF Proxy Error', error: err.message },
                { status: 500 }
            );
        }
    };

    return {
        GET: (req: Request, ctx?: any) => handle(req, ctx),
        POST: (req: Request, ctx?: any) => handle(req, ctx),
        PUT: (req: Request, ctx?: any) => handle(req, ctx),
        PATCH: (req: Request, ctx?: any) => handle(req, ctx),
        DELETE: (req: Request, ctx?: any) => handle(req, ctx),
    };
}
