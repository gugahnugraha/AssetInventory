import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextRequest } from "next/server";

const authMiddleware = NextAuth(authConfig).auth;

// Next.js 16 uses the "proxy" convention instead of "middleware"
export async function proxy(request: NextRequest, event: any) {
  return authMiddleware(request, event);
}

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
