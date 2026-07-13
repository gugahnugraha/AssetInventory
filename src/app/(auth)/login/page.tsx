import { LoginClient } from "./LoginClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Masuk - SIM Inventaris Aset OPD",
  description: "Silakan masuk dengan kredensial Anda untuk mengelola inventaris aset.",
};

export default async function LoginPage() {
  const session = await auth();

  // Redirect to dashboard if user is already logged in
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-zinc-900">
      {/* Decorative emerald gradient backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(4,120,87,0.2),transparent_40%)]" />
      
      {/* Visual background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      
      <LoginClient />
    </div>
  );
}
