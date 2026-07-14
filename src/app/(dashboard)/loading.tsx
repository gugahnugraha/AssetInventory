import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-4 animate-in fade-in-0 duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
        
        {/* Inner pulsing ring */}
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse">
          <Loader2 className="h-5 w-5 text-emerald-600 animate-spin duration-1000" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-bold text-zinc-800 tracking-wide">Memuat data...</span>
        <span className="text-[10px] text-zinc-500">Menyiapkan tampilan sistem inventaris</span>
      </div>
    </div>
  );
}
