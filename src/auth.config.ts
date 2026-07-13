import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiRoute = nextUrl.pathname.startsWith("/api");
      const isLoginRoute = nextUrl.pathname === "/login";

      // Allow API routes to be handled by authorization headers or public checks if needed
      if (isApiRoute) return true;

      if (isLoginRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false; // Directs to login page
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.nama = (user as any).nama || user.name;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.opdId = (user as any).opdId;
      }
      
      // Handle session updates (e.g. if profile changes)
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.nama = token.nama as string;
        session.user.username = token.username as string;
        session.user.role = token.role as any;
        session.user.opdId = token.opdId as string;
      }
      return session;
    },
  },
  providers: [], // Placed empty here for middleware edge compatibility
  secret: process.env.AUTH_SECRET || "f6c8d37482ea69d2f627b7384a22b7bf5ef5cd7db02b70f6bf3fcd5e5eb803d5",
} satisfies NextAuthConfig;
