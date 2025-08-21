
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Import from the new Edge-safe settings service
import { getMinimalSettingsForMiddleware } from '@/services/middleware-settings';
import type { MinimalSystemSettings } from '@/services/middleware-settings';

const publicRoutes = ['/', '/signin', '/signup']; // Add '/' to public routes
const maintenanceRoute = '/maintenance';
const adminRoutePrefix = '/admin';
const dashboardRoute = '/dashboard';

// Default settings structure, ensure it matches MinimalSystemSettings interface
const defaultMinimalMiddlewareSettings: MinimalSystemSettings = {
  maintenanceMode: false,
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();
  let settings: MinimalSystemSettings;

  try {
    settings = await getMinimalSettingsForMiddleware(); // Use the new Edge-safe function
    // console.log(`Middleware: Fetched minimal settings for ${pathname}. Maintenance Mode: ${settings.maintenanceMode}`);
  } catch (error) {
    console.error(`Middleware: CRITICAL Error fetching minimal settings for ${pathname}:`, error);
    // Fallback to default minimal settings if fetching fails
    settings = { ...defaultMinimalMiddlewareSettings };
    // console.log(`Middleware: Using fallback default minimal settings due to error for ${pathname}. Maintenance Mode: ${settings.maintenanceMode}`);
  }

  const hasAuthCookie = request.cookies.has('firebaseAuthToken');
  // console.log(`Middleware Diagnostics for ${pathname}: AuthCookie: ${hasAuthCookie}, Maintenance Setting: ${settings.maintenanceMode}`);

  // --- Maintenance Mode Logic ---
  if (settings.maintenanceMode) {
    // console.log(`Middleware: Maintenance mode IS ON for ${pathname}.`);

    // Allow access to the maintenance page itself
    if (pathname === maintenanceRoute) {
      // console.log(`Middleware: Path ${pathname} is maintenanceRoute. Allowing.`);
      return NextResponse.next();
    }

    // Allow access to sign-in page (so admins can log in to turn off maintenance mode)
    if (pathname === '/signin') {
      // console.log(`Middleware: Path ${pathname} is /signin. Allowing.`);
      return NextResponse.next();
    }

    // Allow API routes (e.g., for Genkit, Firebase, etc.)
    if (pathname.startsWith('/api/')) {
      // console.log(`Middleware: Path ${pathname} is API route. Allowing.`);
      return NextResponse.next();
    }

    // Handle admin routes: admins need to access the admin panel to disable maintenance mode.
    if (pathname.startsWith(adminRoutePrefix)) {
      if (hasAuthCookie) {
        // User has an auth cookie; assume they might be an admin. Let them proceed.
        // Actual role check will happen on the admin pages.
        // console.log(`Middleware: Path ${pathname} is admin route with auth cookie. Allowing.`);
        return NextResponse.next();
      } else {
        // Trying to access admin route without auth. Redirect to sign-in so admin can log in.
        // console.log(`Middleware: Path ${pathname} is admin route, no auth cookie. Redirecting to /signin.`);
        url.pathname = '/signin';
        return NextResponse.redirect(url);
      }
    }

    // For all other routes not explicitly allowed above, redirect to maintenance page
    // console.log(`Middleware: Path ${pathname} not allowed during maintenance. Redirecting to ${maintenanceRoute}.`);
    url.pathname = maintenanceRoute;
    return NextResponse.redirect(url);
  }
  // console.log(`Middleware: Maintenance mode IS OFF for ${pathname}. Proceeding with normal auth logic.`);

  // --- Standard Auth Logic (if not in maintenance mode) ---
  const isProtectedRoute = !publicRoutes.includes(pathname) &&
                           pathname !== maintenanceRoute &&
                           !pathname.startsWith('/_next/') && // Next.js internals
                           !pathname.startsWith('/api/') &&    // API routes (already handled if maintenance was on)
                           pathname !== '/favicon.ico' &&
                           pathname !== '/college-logo.png'; // Static assets

  // 1. User is NOT authenticated and tries to access a PROTECTED route
  if (!hasAuthCookie && isProtectedRoute) {
    // console.log(`Middleware: No auth cookie, accessing protected route ${pathname}. Redirecting to /signin.`);
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // 2. User IS authenticated and tries to access signin/signup pages
  if (hasAuthCookie && (pathname === '/signin' || pathname === '/signup')) {
    // console.log(`Middleware: Auth cookie present, accessing auth route ${pathname}. Redirecting to ${dashboardRoute}.`)
    url.pathname = dashboardRoute; // Redirect to the main dashboard
    return NextResponse.redirect(url);
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
     * - college-logo.png (college logo file)
     * It's important that this matcher DOES include /api routes, /signin, /maintenance, etc.,
     * as the middleware logic needs to run for them.
     */
    '/((?!_next/static|_next/image|favicon.ico|college-logo.png).*)',
  ],
};
