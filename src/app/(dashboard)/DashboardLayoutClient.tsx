"use client";

import * as React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Role } from "@prisma/client";

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

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20 dark:bg-zinc-950 transition-colors">
      {/* Desktop Sidebar (visible on md+) */}
      <div className="hidden md:flex">
        <Sidebar user={user} />
      </div>

      {/* Mobile Sidebar (animated slide-in drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar Drawer */}
          <div className="relative flex flex-col w-64 h-full animate-in slide-in-from-left duration-250">
            <Sidebar user={user} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar user={user} onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
