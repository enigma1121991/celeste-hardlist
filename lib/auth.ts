import NextAuth, { DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Discord from "next-auth/providers/discord"
import { prisma } from "./prisma"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      discordId: string | null
      discordUsername: string | null
      claimedPlayerId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    discordId: string | null
    discordUsername: string | null
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify" // Only request identity, not email
        }
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: null,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
          discordId: profile.id,
          discordUsername: profile.username,
        }
      },
    }),
  ],
  callbacks: {
    async signIn() {
      // Discord info is now properly mapped in the profile callback
      return true
    },
    async redirect({ url, baseUrl }) {
      // After sign in, check if user has a claimed player
      // If not, redirect to claim player page
      if (url.startsWith(baseUrl)) {
        return url
      }
      return baseUrl
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role
        session.user.discordId = user.discordId
        session.user.discordUsername = user.discordUsername
        
        // Get claimed player if exists
        const player = await prisma.player.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })
        session.user.claimedPlayerId = player?.id || null
      }
      return session
    },
  },
  pages: {
    error: "/auth/error",
  },
})

