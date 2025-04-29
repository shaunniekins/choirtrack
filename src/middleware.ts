import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Allow access to the login page regardless of auth status
  if (pathname === "/login") {
    // If user is already logged in, redirect them away from login page to home
    if (isLoggedIn) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.search = ""; // Clear any query params like callbackUrl
      return NextResponse.redirect(redirectUrl);
    }
    // If not logged in, allow access to login page
    return NextResponse.next();
  }

  // If user is not logged in and trying to access a protected route, redirect to login
  if (!isLoggedIn) {
    // Preserve the original requested URL as a query parameter for redirection after login
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is logged in, allow access
  return NextResponse.next();
});

// Optionally, don't invoke Middleware on some paths
// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
