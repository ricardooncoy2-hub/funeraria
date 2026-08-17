"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { PageSpinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/lib/auth/auth-store";

/** Shell autenticado (docs/15 §15.2). El guard real de datos vive en el backend (RB-018);
 * esta redirección es solo UX. */
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user?.mustChangePassword) {
      router.replace("/cambiar-password");
    }
  }, [status, user, router]);

  if (status !== "authenticated" || user?.mustChangePassword) {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
