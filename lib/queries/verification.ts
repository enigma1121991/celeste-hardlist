import { prisma } from "../prisma"

export async function getVerificationQueue() {
  return await prisma.run.findMany({
    where: { 
      verifiedStatus: "PENDING"
    },
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
          image: true,
        },
      },
      verificationActions: {
        include: {
          verifier: {
            select: {
              name: true,
              discordUsername: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function getVerificationHistory(runId: string) {
  return await prisma.verificationAction.findMany({
    where: { runId },
    include: {
      verifier: {
        select: {
          id: true,
          name: true,
          discordUsername: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}


