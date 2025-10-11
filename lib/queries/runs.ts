import { prisma } from "../prisma"
import { VerificationStatus } from "@prisma/client"

export async function getPendingRuns() {
  return await prisma.run.findMany({
    where: { verifiedStatus: VerificationStatus.PENDING },
    include: {
      map: {
        include: {
          creator: true,
        },
      },
      player: {
        select: {
          id: true,
          handle: true,
        },
      },
      submittedBy: {
        select: {
          id: true,
          name: true,
          discordUsername: true,
        },
      },
      verificationActions: {
        include: {
          verifier: {
            select: {
              name: true,
              discordUsername: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function getUserRuns(userId: string) {
  // Get the player associated with the user
  const player = await prisma.player.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!player) {
    return []
  }

  return await prisma.run.findMany({
    where: { playerId: player.id },
    include: {
      map: {
        include: {
          creator: true,
        },
      },
      verificationActions: {
        include: {
          verifier: {
            select: {
              name: true,
              discordUsername: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getRunById(runId: string) {
  return await prisma.run.findUnique({
    where: { id: runId },
    include: {
      map: {
        include: {
          creator: true,
        },
      },
      player: {
        select: {
          id: true,
          handle: true,
        },
      },
      submittedBy: {
        select: {
          id: true,
          name: true,
          discordUsername: true,
        },
      },
      verificationActions: {
        include: {
          verifier: {
            select: {
              name: true,
              discordUsername: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

export async function getPendingRunCount() {
  return await prisma.run.count({
    where: { verifiedStatus: VerificationStatus.PENDING },
  })
}



