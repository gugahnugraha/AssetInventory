import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nama: string;
      username: string;
      role: Role;
      opdId: string;
      opdName?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    nama?: string;
    username?: string;
    role?: Role;
    opdId?: string;
    opdName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    nama?: string;
    username?: string;
    role?: Role;
    opdId?: string;
    opdName?: string;
  }
}
