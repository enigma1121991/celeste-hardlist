import { prisma } from "../prisma"
import { ClaimStatus } from "@prisma/client"

export async function getPendingClaims() {
  return await prisma.playerClaim.findMany({
    where: { status: ClaimStatus.PENDING },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          discordUsername: true,
          image: true,
        },
      },
      player: {
        select: {
          id: true,
          handle: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function getClaimByToken(token: string) {
  return await prisma.playerClaim.findUnique({
    where: { claimToken: token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          discordUsername: true,
        },
      },
      player: {
        select: {
          id: true,
          handle: true,
        },
      },
    },
  })
}

export async function getUserClaim(userId: string) {
  return await prisma.playerClaim.findFirst({
    where: { 
      userId,
      status: ClaimStatus.PENDING,
    },
    include: {
      player: {
        select: {
          id: true,
          handle: true,
        },
      },
    },
  })
}


