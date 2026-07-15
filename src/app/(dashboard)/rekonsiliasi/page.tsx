"use client";

import React from "react";
import { Wrench, ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RekonsiliasiComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-full mb-6 border-8 border-emerald-100 dark:border-emerald-900/30">
        <Construction className="h-20 w-20 text-emerald-600 dark:text-emerald-500" />
      </div>
      
      <h1 className="text-4xl font-black text-zinc-950 dark:text-zinc-50 mb-4 tracking-tight">
        Segera Hadir!
      </h1>
      
      <p className="text-zinc-600 dark:text-zinc-400 max-w-lg mb-8 text-lg font-medium leading-relaxed">
        Fitur <span className="font-bold text-emerald-700 dark:text-emerald-400">Rekonsiliasi Aset</span> sedang dalam tahap pengembangan. 
        Nantinya Anda dapat melakukan pemeriksaan silang antara fisik aset dengan catatan sistem di halaman ini.
      </p>
      
      <Link href="/dashboard" prefetch={false}>
        <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-8 rounded-xl shadow-sm">
          <ArrowLeft className="h-5 w-5" />
          Kembali ke Dashboard
        </Button>
      </Link>
    </div>
  );
}
