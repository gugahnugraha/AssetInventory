import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getUserByUsername, updateUser } from "./services/user";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
          return null;
        }

        const { username, password } = parsedCredentials.data;
        
        try {
          const user = await getUserByUsername(username);
          if (!user) {
            return null;
          }

          if (!user.isActive) {
            throw new Error("Akun Anda telah dinonaktifkan. Silakan hubungi Administrator.");
          }

          const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
          if (!passwordsMatch) {
            return null;
          }

          // Update last login asynchronously
          updateUser(user.id, { lastLogin: new Date() }).catch((err) => {
            console.error("Failed to update last login timestamp:", err);
          });

          return {
            id: user.id,
            name: user.nama,
            nama: user.nama,
            username: user.username,
            role: user.role,
            opdId: user.opdId,
          };
        } catch (error) {
          console.error("Authentication error inside authorize:", error);
          return null;
        }
      },
    }),
  ],
});
