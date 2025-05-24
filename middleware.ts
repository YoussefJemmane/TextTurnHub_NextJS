import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import { getToken } from "next-auth/jwt";

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
    const isApiRoute = req.nextUrl.pathname.startsWith("/api");

    // If protected API route and not authenticated, return unauthorized
    if (isApiRoute && !isAuth && !req.nextUrl.pathname.startsWith("/api/auth")) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Authentication required" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    // If auth page and authenticated, redirect to dashboard or home for admins
    if (isAuthPage && isAuth) {
      if (token.roles && token.roles.includes("admin")) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If not auth page and not authenticated, redirect to login
    if (!isAuthPage && !isAuth && !req.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // Role-based access control
    if (isAuth && token.roles) {
      // Admin-only routes
      if (req.nextUrl.pathname.startsWith("/admin") && !token.roles.includes("admin")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Company-only routes
      if (req.nextUrl.pathname.startsWith("/company") && !token.roles.includes("company")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Artisan-only routes
      if (req.nextUrl.pathname.startsWith("/artisan") && !token.roles.includes("artisan")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/company/:path*",
    "/artisan/:path*",
    "/profile/:path*",
    "/marketplace/:path*",
    "/api/((?!auth/.*).)*",
  ],
};