'use server'

import { revalidatePath } from "next/cache"
import { prisma } from "../prisma"
import { requireAuth } from "../auth-utils"

export async function updatePlayerBio(bio: string) {
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
        error: "You must claim a player profile first" 
      }
    }

    // Validate bio length
    if (bio.length > 500) {
      return { 
        success: false, 
        error: "Bio must be 500 characters or less" 
      }
    }

    // Update player bio
    await prisma.player.update({
      where: { id: player.id },
      data: { bio },
    })

    revalidatePath(`/players/${player.handle}`)
    revalidatePath("/account/settings")

    return { success: true }
  } catch (error) {
    console.error("Error updating bio:", error)
    return { success: false, error: "Failed to update bio" }
  }
}

export async function updatePlayerSocials(data: {
  youtubeUrl?: string
  twitchUrl?: string
  discordHandle?: string
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
        error: "You must claim a player profile first" 
      }
    }

    // Update player socials
    await prisma.player.update({
      where: { id: player.id },
      data: {
        youtubeUrl: data.youtubeUrl || null,
        twitchUrl: data.twitchUrl || null,
        discordHandle: data.discordHandle || null,
      },
    })

    revalidatePath(`/players/${player.handle}`)
    revalidatePath("/account/settings")

    return { success: true }
  } catch (error) {
    console.error("Error updating socials:", error)
    return { success: false, error: "Failed to update social links" }
  }
}




