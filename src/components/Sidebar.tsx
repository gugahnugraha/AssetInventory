"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Boxes,
  GitFork,
  UserCheck,
  Users,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Tags
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

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
    },
    {
      label: "Data Aset",
      href: "/assets",
      icon: Boxes,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
    },
    {
      label: "Bidang/Distribusi",
      href: "/distribusi",
      icon: GitFork,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
    },
    {
      label: "Pemegang Barang",
      href: "/pemegang",
      icon: UserCheck,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
    },
    {
      label: "Master Kategori",
      href: "/kategori",
      icon: Tags,
      roles: [Role.ADMINISTRATOR],
    },
    {
      label: "Kelola User",
      href: "/users",
      icon: Users,
      roles: [Role.ADMINISTRATOR],
    },
    {
      label: "Profil Saya",
      href: "/profile",
      icon: User,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
    },
    {
      label: "Pengaturan",
      href: "/pengaturan",
      icon: Settings,
      roles: [Role.ADMINISTRATOR, Role.OPERATOR, Role.MANAGER],
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
            Made with ❤️ by{" "}
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
