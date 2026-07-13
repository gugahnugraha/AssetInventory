import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getUserByUsername, updateUser } from "./services/user";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || "f6c8d37482ea69d2f627b7384a22b7bf5ef5cd7db02b70f6bf3fcd5e5eb803d5",
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ username: z.string(), password: z.string() })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.warn("[Auth] Credentials validation failed:", parsedCredentials.error.format());
          return null;
        }

        const { username, password } = parsedCredentials.data;
        
        try {
          console.log(`[Auth] Querying user record for username: "${username}"`);
          const user = await getUserByUsername(username);
          if (!user) {
            console.warn(`[Auth] User "${username}" not found in database.`);
            return null;
          }

          console.log(`[Auth] Found user: "${user.username}" (Active: ${user.isActive})`);

          if (!user.isActive) {
            console.warn(`[Auth] User "${username}" is inactive.`);
            throw new Error("Akun Anda telah dinonaktifkan. Silakan hubungi Administrator.");
          }

          const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
          console.log(`[Auth] Password check for "${username}": ${passwordsMatch} (received length: ${password.length})`);
          if (!passwordsMatch) {
            return null;
          }

          // Update last login asynchronously
          updateUser(user.id, { lastLogin: new Date() }).catch((err) => {
            console.error("[Auth] Failed to update last login timestamp:", err);
          });

          return {
            id: user.id,
            name: user.nama,
            nama: user.nama,
            username: user.username,
            role: user.role,
            opdId: user.opdId,
          };
        } catch (error: any) {
          console.error("[Auth] Exception during authorize callback:", error.message || error);
          console.error(error);
          return null;
        }
      },
    }),
  ],
});
