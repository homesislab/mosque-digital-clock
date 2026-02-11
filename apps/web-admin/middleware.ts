import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('admin-session');
    const isLoginPage = request.nextUrl.pathname === '/login';
    const isUploads = request.nextUrl.pathname.startsWith('/uploads');
    const isPublicApi = request.nextUrl.pathname.startsWith('/api/config') ||
        request.nextUrl.pathname.startsWith('/api/devices') ||
        request.nextUrl.pathname.startsWith('/api/health');
    const isOptions = request.method === 'OPTIONS';

    const response = NextResponse.next();

    // Add CORS headers for everything public
    if (isPublicApi || isUploads || isOptions) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-clock-client, x-device-id');
    }

    // Handle OPTIONS early
    if (isOptions) {
        return new NextResponse(null, {
            status: 204,
            headers: response.headers
        });
    }

    // Auth logic
    if (isLoginPage && session) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (!session && !isLoginPage && !isPublicApi && !isUploads && !request.nextUrl.pathname.startsWith('/api/auth')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|uploads|api/media).*)',
    ],
};
