"use client"

import * as React from "react"
import { ThemeToggle } from "./ThemeToggle"
import { Menu, User, Shield } from "lucide-react"
import { Badge } from "./ui/badge"
import { Role } from "@prisma/client"

interface NavbarProps {
  user: {
    nama: string
    username: string
    role: Role
    opdName?: string
  }
  onMobileMenuToggle?: () => void
}

export function Navbar({ user, onMobileMenuToggle }: NavbarProps) {
  // Translate role to user-friendly label
  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.ADMINISTRATOR:
        return "Administrator"
      case Role.OPERATOR:
        return "Operator Aset"
      case Role.MANAGER:
        return "Manager (Read-Only)"
      default:
        return role
    }
  };

  const getRoleVariant = (role: Role) => {
    switch (role) {
      case Role.ADMINISTRATOR:
        return "destructive"
      case Role.OPERATOR:
        return "default"
      case Role.MANAGER:
        return "info"
      default:
        return "outline"
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 border-b bg-background/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onMobileMenuToggle}
          className="p-2 -ml-2 rounded-lg md:hidden hover:bg-accent text-foreground transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="hidden sm:flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Sistem Informasi Inventarisasi</span>
          <span className="font-semibold text-sm text-foreground">{user.opdName || "OPD Kabupaten Bandung"}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        <div className="h-8 w-px bg-border" />

        {/* Profile user widget */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-sm font-bold text-foreground leading-none">{user.nama}</span>
            <span className="text-xs text-muted-foreground mt-1">@{user.username}</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={getRoleVariant(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>

            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
