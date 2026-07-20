"use client";

import * as React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Role } from "@prisma/client";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

interface ClientLayoutProps {
  children: React.ReactNode;
  user: {
    nama: string;
    username: string;
    role: Role;
    opdName?: string;
    opdKode?: string;
  };
}

export function DashboardLayoutClient({ children, user }: ClientLayoutProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  // Route-change loading bar state
  const [isNavigating, setIsNavigating] = React.useState(false);
  const navTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close mobile sidebar on route change + trigger loading bar
  React.useEffect(() => {
    setMobileOpen(false);
    // Flash the loading bar briefly on each navigation
    setIsNavigating(true);
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => setIsNavigating(false), 600);
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100/60 transition-colors">
      {/* Route change progress bar */}
      <div
        className={[
          "fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]",
          "transition-all duration-300 ease-out",
          isNavigating
            ? "opacity-100 w-full animate-pulse"
            : "opacity-0 w-0",
        ].join(" ")}
        aria-hidden="true"
      />

      {/* Desktop Sidebar (visible on md+) */}
      <div className="hidden md:flex">
        <Sidebar user={user} />
      </div>

      {/* Mobile Sidebar (animated slide-in drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
          />
          {/* Sidebar Drawer */}
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full animate-in slide-in-from-left duration-250">
            <Sidebar user={user} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar user={user} onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-zinc-50/40 transition-colors flex flex-col justify-between">
          <div className="mx-auto max-w-7xl w-full flex-1">
            {children}
          </div>
          <footer className="mt-8 py-4 border-t border-zinc-200/80 text-center text-xs text-zinc-700 font-semibold">
            &copy; {new Date().getFullYear()} {APP_NAME}.
          </footer>
        </main>
      </div>
    </div>
  );
}
