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

  return <LoginClient />;
}
