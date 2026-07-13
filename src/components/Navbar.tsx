"use client"

import * as React from "react"
import { Menu, User, LogOut, ChevronDown } from "lucide-react"
import { Badge } from "./ui/badge"
import { ConfirmDialog } from "./ui/confirm-dialog"
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
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.ADMINISTRATOR: return "Administrator"
      case Role.OPERATOR: return "Operator Aset"
      case Role.MANAGER: return "Manager (Read-Only)"
      default: return role
    }
  };

  const getRoleVariant = (role: Role) => {
    switch (role) {
      case Role.ADMINISTRATOR: return "destructive"
      case Role.OPERATOR: return "default"
      case Role.MANAGER: return "info"
      default: return "outline"
    }
  };

  const handleLogoutConfirmed = async () => {
    await logoutAction()
  };

  return (
    <>
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 border-b bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-sm transition-colors dark:border-zinc-800">
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 -ml-2 rounded-lg md:hidden hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="hidden sm:flex flex-col">
          <span className="text-xs text-zinc-800 font-semibold">Sistem Informasi Inventarisasi</span>
          <span className="font-semibold text-sm text-zinc-900">{user.opdName || "OPD Kabupaten Bandung"}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Profile user widget with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer select-none border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
          >
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-sm font-semibold text-zinc-950 leading-none">{user.nama}</span>
              <span className="text-xs text-zinc-800 font-normal mt-1">@{user.username}</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={getRoleVariant(user.role)} className="hidden sm:inline-flex">
                {getRoleLabel(user.role)}
              </Badge>

              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold border-2 border-emerald-200 dark:border-emerald-800/50">
                <User className="h-4 w-4" />
              </div>
              
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 hidden sm:block" />
            </div>
          </button>

          {dropdownOpen && (
            <div 
              className="fixed inset-0 z-20 cursor-default" 
              onClick={() => setDropdownOpen(false)}
            />
          )}

          {dropdownOpen && (
            <div className="absolute right-0 top-14 mt-1.5 w-56 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-xl animate-in fade-in-0 slide-in-from-top-2 duration-150 z-30 p-1.5">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 mb-1.5">
                <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider leading-none">
                  {getRoleLabel(user.role)}
                </p>
                <p className="text-sm font-semibold text-zinc-950 truncate mt-1">{user.nama}</p>
                <p className="text-xs text-zinc-800 font-normal truncate">@{user.username}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); setShowLogoutConfirm(true); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-bold cursor-pointer text-left"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    <ConfirmDialog
      isOpen={showLogoutConfirm}
      onClose={() => setShowLogoutConfirm(false)}
      onConfirm={handleLogoutConfirmed}
      title="Keluar dari Sistem?"
      description="Anda akan keluar dari sesi ini. Pastikan semua pekerjaan sudah tersimpan sebelum melanjutkan."
      confirmLabel="Ya, Keluar"
      variant="warning"
    />
    </>
  )
}
