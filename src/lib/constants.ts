export const APP_NAME = "SIM Aset SKPD";
export const APP_FULL_NAME = "Sistem Informasi Manajemen Aset SKPD";
export const APP_DESCRIPTION = "Aplikasi Sistem Informasi Manajemen Aset SKPD (Satuan Kerja Perangkat Daerah).";

export const DEFAULT_GOVERNMENT_NAME = "PEMERINTAH KABUPATEN BANDUNG";
export const DEFAULT_REGION_NAME = "Kabupaten Bandung";
export const DEFAULT_OPD_NAME = "SKPD Kabupaten Bandung";
export const DEFAULT_OPD_KODE = "SKPD";

/**
 * Helper to construct page titles consistently across all routes
 * e.g., getPageTitle("Dashboard") => "Dashboard - SIM Aset SKPD"
 */
export function getPageTitle(title: string): string {
  return `${title} - ${APP_NAME}`;
}
