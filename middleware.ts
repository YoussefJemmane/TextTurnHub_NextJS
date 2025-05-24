import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If user is logged in and tries to access the root path
    if (path === "/" && token) {
      // Redirect based on user role
      if (token.roles?.includes("company")) {
        return NextResponse.redirect(new URL("/dashboard/company", req.url));
      } else if (token.roles?.includes("admin")) {
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      } else if (token.roles?.includes("artisan")) {
        return NextResponse.redirect(new URL("/dashboard/artisan", req.url));
      } else {
        // Regular user
        return NextResponse.redirect(new URL("/shop", req.url));
      }
    }

    // Protect admin routes
    if (path.startsWith("/admin") && !token?.roles?.includes("admin")) {
      return NextResponse.redirect(new URL("/shop", req.url));
    }

    // Protect artisan routes
    if (
      path.startsWith("/dashboard/artisan") &&
      !token?.roles?.includes("artisan")
    ) {
      return NextResponse.redirect(new URL("/shop", req.url));
    }

    // Protect company routes
    if (path.startsWith("/dashboard/company") && !token?.roles?.includes("company")) {
      return NextResponse.redirect(new URL("/shop", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public access to home page
        if (req.nextUrl.pathname === "/") {
          return true;
        }
        // Require authentication for other protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/", // Add root path to matcher
   
    "/products/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/cart/:path*",
  ],
};
