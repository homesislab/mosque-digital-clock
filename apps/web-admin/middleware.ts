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

    // If trying to access login page while logged in, redirect to dashboard
    if (isLoginPage && session) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // If trying to access dashboard (or other protected routes) without session
    if (!session && !isLoginPage && !isPublicApi && !isOptions && !isUploads && !request.nextUrl.pathname.startsWith('/api/auth')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
