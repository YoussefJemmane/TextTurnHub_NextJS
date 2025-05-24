"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.roles) {
      if (session.user.roles.includes("admin")) {
        router.push("/dashboard/admin");
      } else if (session.user.roles.includes("company")) {
        router.push("/dashboard/company");
      } else if (session.user.roles.includes("artisan")) {
        router.push("/dashboard/artisan");
      } else {
        // Default dashboard for users with no specific role
        router.push("/dashboard/user");
      }
    }
  }, [session, router]);

  // Render a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );
}

