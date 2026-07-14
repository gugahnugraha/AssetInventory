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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Role } from "@prisma/client"

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
    const assetSubPaths = ["/assets", "/mutasi", "/distribusi", "/pemegang", "/kategori", "/kib"];
    return assetSubPaths.some(path => pathname.startsWith(path));
  }, [pathname]);

  const isRekonPathActive = React.useMemo(() => {
    return pathname.startsWith("/rekonsiliasi");
  }, [pathname]);

  const [assetsExpanded, setAssetsExpanded] = React.useState(isAssetPathActive);
  const [rekonExpanded, setRekonExpanded] = React.useState(isRekonPathActive);

  React.useEffect(() => {
    if (isAssetPathActive) setAssetsExpanded(true);
    if (isRekonPathActive) setRekonExpanded(true);
  }, [pathname, isAssetPathActive, isRekonPathActive]);

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
    },
    {
      label: "Manajemen Aset",
      icon: Boxes,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
      expandedState: assetsExpanded,
      setExpanded: setAssetsExpanded,
      children: [
        {
          label: "Data Aset",
          href: "/assets",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
        },
        {
          label: "Mutasi Aset",
          href: "/mutasi",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
        },
        {
          label: "Distribusi Aset (Bidang)",
          href: "/distribusi",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
        },
        {
          label: "Pemegang Barang",
          href: "/pemegang",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
        },
        {
          label: "Kategori Aset",
          href: "/kategori",
          roles: [Role.ADMINISTRATOR],
        },
        {
          label: "Master KIB",
          href: "/kib",
          roles: [Role.ADMINISTRATOR],
        },
      ]
    },
    {
      label: "Rekonsiliasi Aset",
      icon: ClipboardCheck,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
      expandedState: rekonExpanded,
      setExpanded: setRekonExpanded,
      children: [
        {
          label: "Dashboard Rekonsiliasi",
          href: "/rekonsiliasi/dashboard",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
        },
        {
          label: "Periode Rekonsiliasi",
          href: "/rekonsiliasi/periode",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
        },
        {
          label: "Pemeriksaan Aset",
          href: "/rekonsiliasi/pemeriksaan",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
        },
        {
          label: "Temuan Rekonsiliasi",
          href: "/rekonsiliasi/temuan",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
        },
        {
          label: "Laporan Rekonsiliasi",
          href: "/rekonsiliasi/laporan",
          roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
        },
      ],
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
              <span className="font-bold text-sm leading-tight tracking-wider">ASET INVENTARIS</span>
              <span className="text-xs text-emerald-300">{user.opdName || "Diskominfo Kab. Bandung"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          if (!link.roles.includes(user.role)) return null

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
                      if (link.label === "Manajemen Aset") {
                        setAssetsExpanded(true);
                        setRekonExpanded(false);
                      } else if (link.label === "Rekonsiliasi Aset") {
                        setRekonExpanded(true);
                        setAssetsExpanded(false);
                      }
                    } else {
                      if (link.label === "Manajemen Aset") {
                        const nextVal = !assetsExpanded;
                        setAssetsExpanded(nextVal);
                        if (nextVal) setRekonExpanded(false);
                      } else if (link.label === "Rekonsiliasi Aset") {
                        const nextVal = !rekonExpanded;
                        setRekonExpanded(nextVal);
                        if (nextVal) setAssetsExpanded(false);
                      }
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
          const isActive = activeLink(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
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
