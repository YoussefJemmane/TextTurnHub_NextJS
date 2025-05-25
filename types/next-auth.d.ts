// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    roles: string[];
    hasArtisanProfile: boolean;
    hasCompanyProfile: boolean;
    hasBuyerProfile: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      hasArtisanProfile: boolean;
      hasCompanyProfile: boolean;
      hasBuyerProfile: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    hasArtisanProfile: boolean;
    hasCompanyProfile: boolean;
    hasBuyerProfile: boolean;
  }
}