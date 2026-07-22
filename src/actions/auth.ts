"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const turnstileToken = formData.get("turnstileToken") as string;

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  if (!turnstileToken) {
    return { error: "Verifikasi keamanan gagal (Token hilang)." };
  }

  try {
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA"}&response=${turnstileToken}`,
    });
    
    const verifyData = await verifyRes.json();
    
    if (!verifyData.success) {
      console.warn("Turnstile failed:", verifyData);
      return { error: "Verifikasi keamanan gagal." };
    }
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { error: "Terjadi kesalahan saat memverifikasi keamanan." };
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
