import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Next.js 16 uses the "proxy" convention instead of "middleware"
export const proxy = NextAuth(authConfig).auth;

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api/auth (Auth.js authentication endpoints)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - login (login page itself)
   */
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};
