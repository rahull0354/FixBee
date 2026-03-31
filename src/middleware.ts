import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/login",
  "/login/customer",
  "/login/provider",
  "/login/admin",
  "/register",
  "/register/customer",
  "/register/provider",
  "/forgot-password",
];

// Role-based dashboard mappings
const dashboardRoutes = {
  customer: "/customer/dashboard",
  provider: "/provider/dashboard",
  admin: "/admin/dashboard",
};

// Allowed routes for suspended providers
const suspendedProviderAllowedRoutes = [
  "/provider/dashboard",
  "/provider/profile",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get authentication indicators from cookies
  const authToken = request.cookies.get("auth_token")?.value;
  const userRole = request.cookies.get("user_role")?.value as
    | "customer"
    | "provider"
    | "admin"
    | null;
  const isSuspended = request.cookies.get("is_suspended")?.value === "true";

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.includes(pathname);

  if (!isPublicRoute && !authToken && !userRole) {
    // Determine the appropriate login page based on the requested path
    let loginPath = "/login";

    if (pathname.startsWith("/customer")) {
      loginPath = "/login/customer";
    } else if (pathname.startsWith("/provider")) {
      loginPath = "/login/provider";
    } else if (pathname.startsWith("/admin")) {
      loginPath = "/login/admin";
    }

    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    authToken &&
    userRole &&
    (pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname === "/forgot-password")
  ) {
    // Only redirect to dashboard if user has BOTH auth_token AND user_role
    // user_role alone means they registered but haven't logged in yet
    const dashboardPath = dashboardRoutes[userRole];
    if (dashboardPath) {
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  // Check if provider is suspended and restrict access
  if (userRole === "provider" && isSuspended) {
    // Only allow dashboard and profile pages for suspended providers
    const isAllowedRoute = suspendedProviderAllowedRoutes.some(route =>
      pathname === route || pathname.startsWith(route + "/")
    );

    if (!isAllowedRoute) {
      // Redirect to dashboard
      return NextResponse.redirect(new URL("/provider/dashboard?suspended=true", request.url));
    }
  }

  if (userRole) {
    // Customer trying to access provider/admin routes
    if (
      userRole === "customer" &&
      (pathname.startsWith("/provider") || pathname.startsWith("/admin"))
    ) {
      return NextResponse.redirect(new URL("/customer/dashboard", request.url));
    }

    // Provider trying to access customer/admin routes
    if (
      userRole === "provider" &&
      (pathname.startsWith("/customer") || pathname.startsWith("/admin"))
    ) {
      return NextResponse.redirect(new URL("/provider/dashboard", request.url));
    }

    // Admin trying to access customer/provider routes
    if (
      userRole === "admin" &&
      (pathname.startsWith("/customer") || pathname.startsWith("/provider"))
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except API routes, static files, and Next.js internals
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
