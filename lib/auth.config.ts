import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              roles: {
                include: {
                  role: true
                }
              },
              artisanProfile: true,
              companyProfile: true,
              buyerProfile: true
            }
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Return user data that will be stored in the token/session
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles.map(ur => ur.role.name),
            hasArtisanProfile: !!user.artisanProfile,
            hasCompanyProfile: !!user.companyProfile,
            hasBuyerProfile: !!user.buyerProfile,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Store user info in JWT token
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.hasArtisanProfile = user.hasArtisanProfile;
        token.hasCompanyProfile = user.hasCompanyProfile;
        token.hasBuyerProfile = user.hasBuyerProfile;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
        session.user.hasArtisanProfile = token.hasArtisanProfile as boolean;
        session.user.hasCompanyProfile = token.hasCompanyProfile as boolean;
        session.user.hasBuyerProfile = token.hasBuyerProfile as boolean;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development", // Enable debug in development
};