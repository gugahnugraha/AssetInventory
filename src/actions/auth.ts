"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      // In next-auth v5, credentials errors are captured here
      if (error.cause?.err?.message) {
        return { error: error.cause.err.message };
      }
      return { error: "Username atau password salah." };
    }
    
    // Fallback error logging
    console.error("Login action unexpected error:", error);
    return { error: "Gagal masuk ke sistem. Silakan hubungi admin." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
