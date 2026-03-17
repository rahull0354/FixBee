import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/login/customer',
  '/auth/login/provider',
  '/auth/login/admin',
  '/auth/register/customer',
  '/auth/register/provider',
  '/auth/forgot-password',
];

// Role-specific route prefixes
const roleRoutes = {
  customer: '/customer',
  provider: '/provider',
  admin: '/admin',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value as 'customer' | 'provider' | 'admin' | null;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route));

  // If accessing a protected route without authentication, redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated, check role-based access
  if (token && userRole) {
    // Redirect customer away from provider/admin routes
    if (userRole === 'customer' && (pathname.startsWith('/provider') || pathname.startsWith('/admin'))) {
      return NextResponse.redirect(new URL('/customer/dashboard', request.url));
    }

    // Redirect provider away from customer/admin routes
    if (userRole === 'provider' && (pathname.startsWith('/customer') || pathname.startsWith('/admin'))) {
      return NextResponse.redirect(new URL('/provider/dashboard', request.url));
    }

    // Redirect admin away from customer/provider routes
    if (userRole === 'admin' && (pathname.startsWith('/customer') || pathname.startsWith('/provider'))) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // If accessing role-specific routes without the correct role, redirect
    if (pathname.startsWith('/customer') && userRole !== 'customer') {
      return NextResponse.redirect(new URL('/auth/login/customer', request.url));
    }
    if (pathname.startsWith('/provider') && userRole !== 'provider') {
      return NextResponse.redirect(new URL('/auth/login/provider', request.url));
    }
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login/admin', request.url));
    }
  }

  // If accessing auth pages while authenticated, redirect to appropriate dashboard
  if (token && userRole && pathname.startsWith('/auth')) {
    const dashboardRoute = roleRoutes[userRole];
    return NextResponse.redirect(new URL(`${dashboardRoute}/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
