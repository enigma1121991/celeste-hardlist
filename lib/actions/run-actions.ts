'use server'

import { revalidatePath } from "next/cache"
import { prisma } from "../prisma"
import { requireAuth, requireRole } from "../auth-utils"
import { RunType, UserRole, VerificationStatus } from "@prisma/client"

export async function submitRun(data: {
  mapId: string
  type: RunType
  evidenceUrls: string[]
  submitterNotes?: string
}) {
  try {
    const session = await requireAuth()

    // Get user's claimed player
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true, handle: true },
    })

    if (!player) {
      return { 
        success: false, 
        error: "You must claim a player profile before submitting runs" 
      }
    }

    // Validate evidence URLs
    if (!data.evidenceUrls || data.evidenceUrls.length === 0) {
      return {
        success: false,
        error: "At least one evidence URL is required"
      }
    }

    // Check if run already exists for this map/player/type
    const existingRun = await prisma.run.findUnique({
      where: {
        mapId_playerId_type: {
          mapId: data.mapId,
          playerId: player.id,
          type: data.type,
        },
      },
    })

    if (existingRun) {
      return { 
        success: false, 
        error: "You have already submitted a run for this map and type. Please update your existing submission instead." 
      }
    }

    // Create the run
    const run = await prisma.run.create({
      data: {
        mapId: data.mapId,
        playerId: player.id,
        type: data.type,
        evidenceUrls: data.evidenceUrls,
        submitterNotes: data.submitterNotes,
        verifiedStatus: VerificationStatus.PENDING,
        submittedById: session.user.id,
      },
    })

    revalidatePath(`/players/${player.handle}`)
    revalidatePath("/verification-queue")

    return { success: true, runId: run.id }
  } catch (error) {
    console.error("Error submitting run:", error)
    return { success: false, error: "Failed to submit run" }
  }
}

export async function verifyRun(runId: string, reason?: string, note?: string) {
  try {
    const session = await requireRole(UserRole.VERIFIER)

    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: { 
        player: true,
        map: true,
        submittedBy: true,
      },
    })

    if (!run) {
      return { success: false, error: "Run not found" }
    }

    if (run.verifiedStatus !== VerificationStatus.PENDING) {
      return { success: false, error: "Run is not pending verification" }
    }

    // Update run, create verification action, and notify user
    await prisma.$transaction([
      prisma.run.update({
        where: { id: runId },
        data: { verifiedStatus: VerificationStatus.VERIFIED },
      }),
      prisma.verificationAction.create({
        data: {
          runId,
          verifierId: session.user.id,
          action: "VERIFY",
          reason,
          note,
        },
      }),
      ...(run.submittedById ? [
        prisma.notification.create({
          data: {
            userId: run.submittedById,
            type: "RUN_VERIFIED",
            title: "Run Verified!",
            message: `Your run on "${run.map.name}" has been verified and is now live on the leaderboard.${note ? ` Note: ${note}` : ''}`,
            link: `/players/${run.player.handle}`,
          },
        })
      ] : []),
    ])

    revalidatePath(`/players/${run.player.handle}`)
    revalidatePath(`/maps/${run.map.slug}`)
    revalidatePath("/verification-queue")
    revalidatePath("/my-submissions")

    return { success: true }
  } catch (error) {
    console.error("Error verifying run:", error)
    return { success: false, error: "Failed to verify run" }
  }
}

export async function rejectRun(runId: string, reason: string) {
  try {
    const session = await requireRole(UserRole.VERIFIER)

    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: { 
        player: true,
        map: true,
        submittedBy: true,
      },
    })

    if (!run) {
      return { success: false, error: "Run not found" }
    }

    if (run.verifiedStatus !== VerificationStatus.PENDING) {
      return { success: false, error: "Run is not pending verification" }
    }

    // Mark run as DISPUTED, create verification action record, and notify user
    await prisma.$transaction([
      prisma.run.update({
        where: { id: runId },
        data: { verifiedStatus: VerificationStatus.DISPUTED },
      }),
      prisma.verificationAction.create({
        data: {
          runId,
          verifierId: session.user.id,
          action: "REJECT",
          reason,
        },
      }),
      ...(run.submittedById ? [
        prisma.notification.create({
          data: {
            userId: run.submittedById,
            type: "RUN_REJECTED",
            title: "Run Rejected",
            message: `Your run on "${run.map.name}" was rejected. Reason: ${reason}`,
            link: `/my-submissions`,
          },
        })
      ] : []),
    ])

    revalidatePath(`/players/${run.player.handle}`)
    revalidatePath(`/maps/${run.map.slug}`)
    revalidatePath("/verification-queue")
    revalidatePath("/my-submissions")

    return { success: true }
  } catch (error) {
    console.error("Error rejecting run:", error)
    return { success: false, error: "Failed to reject run" }
  }
}

export async function requestRunChanges(runId: string, reason: string) {
  try {
    const session = await requireRole(UserRole.VERIFIER)

    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        map: true,
        submittedBy: true,
      },
    })

    if (!run) {
      return { success: false, error: "Run not found" }
    }

    if (run.verifiedStatus !== VerificationStatus.PENDING) {
      return { success: false, error: "Run is not pending verification" }
    }

    // Create verification action record and notify user
    await prisma.$transaction([
      prisma.verificationAction.create({
        data: {
          runId,
          verifierId: session.user.id,
          action: "REQUEST_CHANGES",
          reason,
        },
      }),
      ...(run.submittedById ? [
        prisma.notification.create({
          data: {
            userId: run.submittedById,
            type: "RUN_CHANGES_REQUESTED",
            title: "Changes Requested",
            message: `Changes requested for your run on "${run.map.name}". ${reason}`,
            link: `/my-submissions`,
          },
        })
      ] : []),
    ])

    revalidatePath("/verification-queue")
    revalidatePath("/my-submissions")

    return { success: true }
  } catch (error) {
    console.error("Error requesting run changes:", error)
    return { success: false, error: "Failed to request changes" }
  }
}

export async function updateRunSubmission(
  runId: string,
  data: {
    evidenceUrls: string[]
    submitterNotes?: string
  }
) {
  try {
    const session = await requireAuth()

    // Get the run
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        player: true,
        map: true,
      },
    })

    if (!run) {
      return { success: false, error: "Run not found" }
    }

    // Check if user owns this run
    if (run.submittedById !== session.user.id) {
      return { success: false, error: "You can only edit your own submissions" }
    }

    // Only allow editing if not verified
    if (run.verifiedStatus === VerificationStatus.VERIFIED) {
      return { success: false, error: "Cannot edit a verified run" }
    }

    // Validate evidence URLs
    if (!data.evidenceUrls || data.evidenceUrls.length === 0) {
      return {
        success: false,
        error: "At least one evidence URL is required"
      }
    }

    const wasDisputed = run.verifiedStatus === VerificationStatus.DISPUTED
    const oldUrls = run.evidenceUrls.join(', ')
    const newUrls = data.evidenceUrls.join(', ')

    // Update the run, reset status to PENDING, and create an UPDATE action
    await prisma.$transaction([
      prisma.run.update({
        where: { id: runId },
        data: {
          evidenceUrls: data.evidenceUrls,
          submitterNotes: data.submitterNotes,
          verifiedStatus: VerificationStatus.PENDING,
        },
      }),
      prisma.verificationAction.create({
        data: {
          runId,
          verifierId: null, // User-initiated action
          action: "UPDATE",
          reason: `Submitter updated evidence URLs${oldUrls !== newUrls ? ` from [${oldUrls}] to [${newUrls}]` : ''}${wasDisputed ? ' (was disputed)' : ''}`,
        },
      }),
    ])

    revalidatePath(`/players/${run.player.handle}`)
    revalidatePath("/verification-queue")
    revalidatePath("/my-submissions")

    return { success: true }
  } catch (error) {
    console.error("Error updating run submission:", error)
    return { success: false, error: "Failed to update submission" }
  }
}

