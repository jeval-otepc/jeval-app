// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const token = req.cookies.get('auth_token')?.value; // or header if you forward it
    const { pathname } = req.nextUrl;

    const isProtected = pathname.startsWith('/dashboard'); // tweak to your routes
    if (isProtected && !token) {
        const url = new URL('/login', req.url);
        url.searchParams.set('reason', 'notoken');
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
