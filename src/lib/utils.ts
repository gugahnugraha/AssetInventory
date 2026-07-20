import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getRowValue(row: Record<string, any>, possibleKeys: string[]): any {
  if (!row || typeof row !== "object") return undefined;

  for (const k of possibleKeys) {
    if (k in row && row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
      return row[k];
    }
  }

  const rowKeys = Object.keys(row);
  const normalizedTargets = possibleKeys.map(normalizeKey);

  for (const rk of rowKeys) {
    const normRk = normalizeKey(rk);
    if (normalizedTargets.includes(normRk)) {
      const val = row[rk];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return val;
      }
    }
  }

  return undefined;
}
