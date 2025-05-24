"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname.startsWith("/dashboard");
    }
    return pathname === path;
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="bg-white shadow-sm mb-8">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-teal-600">
            TexTurn Hub
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className={`${
                  isActive("/dashboard")
                    ? "text-teal-600 font-medium"
                    : "text-gray-700 hover:text-teal-600"
                }`}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/"
                className={`${
                  isActive("/")
                    ? "text-teal-600 font-medium"
                    : "text-gray-700 hover:text-teal-600"
                }`}
              >
                Home
              </Link>
            )}
            {isAuthenticated && (
              <Link
                href="/marketplace"
                className={`${
                  isActive("/marketplace")
                    ? "text-teal-600 font-medium"
                    : "text-gray-700 hover:text-teal-600"
                }`}
              >
                Marketplace
              </Link>
            )}
            {(!isAuthenticated || (isAuthenticated && !session?.user?.roles?.includes("company"))) && (
              <Link
                href="/shop"
                className={`${
                  isActive("/shop")
                    ? "text-teal-600 font-medium"
                    : "text-gray-700 hover:text-teal-600"
                }`}
              >
                Shop
              </Link>
            )}
            {isAuthenticated && (
              <>
               
                <Link
                  href="/profile"
                  className={`${
                    isActive("/profile")
                      ? "text-teal-600 font-medium"
                      : "text-gray-700 hover:text-teal-600"
                  }`}
                >
                  Profile
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  {session?.user?.name || session?.user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-red-600 hover:text-red-800"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
