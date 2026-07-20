"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  ClipboardCheck,
  Database,
  BookOpen,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Role } from "@prisma/client"
import { APP_NAME, DEFAULT_OPD_NAME } from "@/lib/constants"

interface SidebarProps {
  user: {
    nama: string
    username: string
    role: Role
    opdName?: string
    opdKode?: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  // Auto-expand accordion if path matches one of the child links
  const isAssetPathActive = React.useMemo(() => {
    const assetSubPaths = ["/assets", "/mutasi"];
    return assetSubPaths.some(path => pathname.startsWith(path));
  }, [pathname]);

  const isMasterPathActive = React.useMemo(() => {
    const masterSubPaths = ["/distribusi", "/pemegang", "/kategori", "/kib"];
    return masterSubPaths.some(path => pathname.startsWith(path));
  }, [pathname]);

  const [assetsExpanded, setAssetsExpanded] = React.useState(isAssetPathActive);
  const [masterExpanded, setMasterExpanded] = React.useState(isMasterPathActive);

  const toggleAssetsExpanded = React.useCallback(() => {
    setAssetsExpanded((prev) => {
      const next = !prev;
      if (next) setMasterExpanded(false);
      return next;
    });
  }, []);

  const toggleMasterExpanded = React.useCallback(() => {
    setMasterExpanded((prev) => {
      const next = !prev;
      if (next) setAssetsExpanded(false);
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (isAssetPathActive) {
      setAssetsExpanded(true);
      setMasterExpanded(false);
    } else if (isMasterPathActive) {
      setMasterExpanded(true);
      setAssetsExpanded(false);
    }
  }, [pathname, isAssetPathActive, isMasterPathActive]);

  interface LinkItem {
    label: string;
    href?: string;
    icon?: any;
    roles: Role[];
    divider?: boolean;
    expandedState?: boolean;
    setExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
    children?: {
      label: string;
      href: string;
      roles: Role[];
    }[];
  }

  const links: LinkItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
    },
    {
      label: "__divider_1__",
      divider: true,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
    },
    {
      label: "Manajemen Aset",
      icon: Boxes,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
      expandedState: assetsExpanded,
      setExpanded: setAssetsExpanded,
      children: [
        {
          label: "Data Aset",
          href: "/assets",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
        },
        {
          label: "Mutasi Aset",
          href: "/mutasi",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
        },
      ]
    },
    {
      label: "Master Data",
      icon: Database,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
      expandedState: masterExpanded,
      setExpanded: setMasterExpanded,
      children: [
        {
          label: "Bidang & Unit Kerja",
          href: "/distribusi",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
        },
        {
          label: "Pemegang Aset",
          href: "/pemegang",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
        },
        {
          label: "Kategori Aset",
          href: "/kategori",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.DEMO],
        },
        {
          label: "KIB",
          href: "/kib",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.DEMO],
        },
      ]
    },
    {
      label: "__divider_2__",
      divider: true,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
    },
    {
      label: "Rekonsiliasi Aset",
      href: "/rekonsiliasi",
      icon: ClipboardCheck,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
    },
    {
      label: "__divider_3__",
      divider: true,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
    },
    {
      label: "Dokumentasi",
      href: "/dokumentasi",
      icon: BookOpen,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
    },
    {
      label: "Tentang Aplikasi",
      href: "/about",
      icon: Info,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER, Role.DEMO],
    },
  ]

  const activeLink = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-linear-to-b from-emerald-800 to-emerald-950 text-white shadow-xl transition-all duration-300 z-30 border-r border-emerald-700/30",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-emerald-700/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-emerald-700 rounded-lg shrink-0">
            <Shield className="h-5 w-5 text-emerald-300" />
          </div>
          {!collapsed && (
            <div className="flex flex-col select-none">
              <span className="font-extrabold text-sm leading-tight tracking-wider text-emerald-100">{APP_NAME}</span>
              <span className="text-[11px] text-emerald-300/90 font-medium">{user.opdKode || DEFAULT_OPD_NAME}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {links.map((link, idx) => {
          if (!link.roles.includes(user.role)) return null

          // Render divider
          if (link.divider) {
            return (
              <div key={`divider-${idx}`} className={cn("my-1 px-2", collapsed && "px-1")}>
                <div className="border-t border-emerald-700/40" />
              </div>
            );
          }
          if (link.children) {
            const visibleChildren = link.children.filter(child => child.roles.includes(user.role));
            if (visibleChildren.length === 0) return null;

            const Icon = link.icon;
            const isAnyChildActive = visibleChildren.some(child => pathname.startsWith(child.href));

            return (
              <div key={link.label} className="space-y-1">
                <button
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                    }
                    if (link.label === "Manajemen Aset") {
                      toggleAssetsExpanded();
                    } else if (link.label === "Master Data") {
                      toggleMasterExpanded();
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                    isAnyChildActive
                      ? "bg-emerald-700/40 text-white font-semibold"
                      : "text-emerald-100 hover:bg-emerald-700/50 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                      isAnyChildActive ? "text-emerald-200" : "text-emerald-300/80"
                    )} />
                    {!collapsed && <span>{link.label}</span>}
                  </div>
                  {!collapsed && (
                    link.expandedState
                      ? <ChevronDown className="h-4 w-4 text-emerald-300" />
                      : <ChevronRight className="h-4 w-4 text-emerald-300" />
                  )}
                </button>

                {link.expandedState && !collapsed && (
                  <div className="pl-4 space-y-1 border-l border-emerald-700/30 ml-5 mt-1">
                    {visibleChildren.map((child) => {
                      const isChildActive = pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          prefetch={false}
                          className={cn(
                            "block px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
                            isChildActive
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-emerald-150 hover:bg-emerald-700/30 hover:text-white"
                          )}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = link.icon
          const isActive = link.href ? activeLink(link.href) : false

          return (
            <Link
              key={link.href || link.label}
              href={link.href || "#"}
              prefetch={false}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                isActive
                  ? "bg-emerald-600/90 text-white shadow-md shadow-emerald-900/30 border border-emerald-500/30"
                  : "text-emerald-100 hover:bg-emerald-700/50 hover:text-white"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                isActive ? "text-emerald-200" : "text-emerald-300/80"
              )} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-emerald-700/50 text-center text-xs text-emerald-350">
        {!collapsed ? (
          <span>
            Made with ♥ by{" "}
            <a
              href="https://github.com/gugahnugraha"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline font-semibold"
            >
              Gugah Nugraha
            </a>
          </span>
        ) : (
          <span title="Made with heart by Gugah Nugraha">
            <a
              href="https://github.com/gugahnugraha"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:scale-115 inline-block transition-transform font-bold"
            >
              ♥
            </a>
          </span>
        )}
      </div>



      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-20 -right-3 p-1 rounded-full bg-emerald-600 border border-emerald-500 text-white shadow-md hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all cursor-pointer z-40 hidden md:block"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}
