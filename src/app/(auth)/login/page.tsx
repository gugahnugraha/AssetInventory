import { LoginClient } from "./LoginClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getPageTitle } from "@/lib/constants";

export const metadata: Metadata = {
  title: getPageTitle("Masuk"),
  description: "Masuk ke Sistem Informasi Manajemen Aset SKPD.",
};

export default async function LoginPage() {
  const session = await auth();

  // Redirect to dashboard if user is already logged in
  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}
