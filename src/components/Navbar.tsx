"use client"

import * as React from "react"
import { ThemeToggle } from "./ThemeToggle"
import { Menu, User, Shield, LogOut, ChevronDown } from "lucide-react"
import { Badge } from "./ui/badge"
import { Role } from "@prisma/client"
import { logoutAction } from "@/actions/auth"

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
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

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

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      await logoutAction()
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

        {/* Profile user widget with Dropdown */}
        <div className="relative">
          {/* Trigger */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer select-none border border-transparent hover:border-border/30"
          >
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-sm font-bold text-foreground leading-none">{user.nama}</span>
              <span className="text-xs text-muted-foreground mt-1">@{user.username}</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={getRoleVariant(user.role)} className="hidden sm:inline-flex">
                {getRoleLabel(user.role)}
              </Badge>

              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                <User className="h-4 w-4" />
              </div>
              
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </div>
          </button>

          {/* Backdrop Click-Away */}
          {dropdownOpen && (
            <div 
              className="fixed inset-0 z-20 cursor-default" 
              onClick={() => setDropdownOpen(false)}
            />
          )}

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-14 mt-1.5 w-56 rounded-lg border bg-card text-card-foreground shadow-lg ring-1 ring-black/5 animate-in fade-in-0 slide-in-from-top-2 duration-150 z-30 p-1.5 border-border">
              <div className="px-3 py-2 border-b border-border/60 mb-1.5">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider leading-none">
                  {getRoleLabel(user.role)}
                </p>
                <p className="text-sm font-bold text-foreground truncate mt-1">{user.nama}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md transition-colors font-bold cursor-pointer text-left"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
