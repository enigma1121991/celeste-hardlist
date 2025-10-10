'use server'

import { revalidatePath } from "next/cache"
import { prisma } from "../prisma"
import { requireRole } from "../auth-utils"
import { ClaimStatus, UserRole } from "@prisma/client"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createPlayerClaim(playerId: string, userId: string) {
  try {
    // Check if user already has a claim
    const existingClaim = await prisma.playerClaim.findFirst({
      where: {
        userId,
        status: ClaimStatus.PENDING,
      },
    })

    if (existingClaim) {
      return { 
        success: false, 
        error: "You already have a pending player claim" 
      }
    }

    // Check if player is already claimed
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { userId: true },
    })

    if (player?.userId) {
      return { 
        success: false, 
        error: "This player is already claimed by another user" 
      }
    }

    // Check if there's already a pending claim for this player
    const pendingClaim = await prisma.playerClaim.findFirst({
      where: {
        playerId,
        status: ClaimStatus.PENDING,
      },
    })

    if (pendingClaim) {
      return { 
        success: false, 
        error: "This player already has a pending claim" 
      }
    }

    // Create the claim
    const claim = await prisma.playerClaim.create({
      data: {
        userId,
        playerId,
        status: ClaimStatus.PENDING,
      },
    })

    return { 
      success: true, 
      claimToken: claim.claimToken 
    }
  } catch (error) {
    console.error("Error creating player claim:", error)
    return { 
      success: false, 
      error: "Failed to create player claim" 
    }
  }
}

export async function approvePlayerClaim(claimId: string) {
  try {
    const session = await requireRole(UserRole.VERIFIER)

    const claim = await prisma.playerClaim.findUnique({
      where: { id: claimId },
      include: { player: true },
    })

    if (!claim) {
      return { success: false, error: "Claim not found" }
    }

    if (claim.status !== ClaimStatus.PENDING) {
      return { success: false, error: "Claim is not pending" }
    }

    // Update claim status and link player to user
    await prisma.$transaction([
      prisma.playerClaim.update({
        where: { id: claimId },
        data: {
          status: ClaimStatus.APPROVED,
          approvedBy: session.user.id,
        },
      }),
      prisma.player.update({
        where: { id: claim.playerId },
        data: { userId: claim.userId },
      }),
    ])

    revalidatePath("/admin/claims")
    revalidatePath(`/players/${claim.player.handle}`)

    return { success: true }
  } catch (error) {
    console.error("Error approving player claim:", error)
    return { success: false, error: "Failed to approve claim" }
  }
}

export async function rejectPlayerClaim(claimId: string, reason?: string) {
  try {
    const session = await requireRole(UserRole.VERIFIER)

    const claim = await prisma.playerClaim.findUnique({
      where: { id: claimId },
    })

    if (!claim) {
      return { success: false, error: "Claim not found" }
    }

    if (claim.status !== ClaimStatus.PENDING) {
      return { success: false, error: "Claim is not pending" }
    }

    await prisma.playerClaim.update({
      where: { id: claimId },
      data: {
        status: ClaimStatus.REJECTED,
        rejectedBy: session.user.id,
        reason,
      },
    })

    revalidatePath("/admin/claims")

    return { success: true }
  } catch (error) {
    console.error("Error rejecting player claim:", error)
    return { success: false, error: "Failed to reject claim" }
  }
}

export async function createNewPlayer(handle: string, userId: string) {
  try {
    // Validate handle format
    if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
      return { 
        success: false, 
        error: "Handle can only contain letters, numbers, underscores, and hyphens" 
      }
    }

    if (handle.length < 3 || handle.length > 32) {
      return { 
        success: false, 
        error: "Handle must be between 3 and 32 characters" 
      }
    }

    // Check if user already has a player
    const existingPlayer = await prisma.player.findUnique({
      where: { userId },
    })

    if (existingPlayer) {
      return { 
        success: false, 
        error: "You already have a player profile" 
      }
    }

    // Check if handle is already taken
    const handleExists = await prisma.player.findUnique({
      where: { handle },
    })

    if (handleExists) {
      return { 
        success: false, 
        error: "This handle is already taken. Please choose another." 
      }
    }

    // Create slug from handle
    const slug = slugify(handle)

    // Check if slug is already taken
    const slugExists = await prisma.player.findFirst({
      where: { 
        handle: {
          equals: slug,
          mode: 'insensitive'
        }
      },
    })

    if (slugExists) {
      return { 
        success: false, 
        error: "A similar handle already exists. Please choose another." 
      }
    }

    // Create the new player and link to user
    const player = await prisma.player.create({
      data: {
        handle,
        userId,
      },
    })

    revalidatePath(`/players/${handle}`)
    revalidatePath("/players")

    return { 
      success: true, 
      handle: player.handle 
    }
  } catch (error) {
    console.error("Error creating new player:", error)
    return { 
      success: false, 
      error: "Failed to create player" 
    }
  }
}

