import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventaris Aset OPD - Kabupaten Bandung",
  description: "Aplikasi pengelolaan dan penatausahaan barang milik daerah OPD Kabupaten Bandung.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <body className={`${inter.className} min-h-full bg-background font-sans antialiased text-foreground`}>
        {children}
      </body>
    </html>
  );
}
