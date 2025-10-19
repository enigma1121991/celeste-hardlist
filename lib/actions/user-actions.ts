'use server'

import { revalidatePath } from "next/cache"
import { prisma } from "../prisma"
import { requireAuth } from "../auth-utils"

export async function updatePlayerBio(bio: string, pronouns: string, inputMethod: string) {
  try {
    const session = await requireAuth()

    // Get user's claimed player
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true, handle: true },
    })
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, pronouns: true, inputMethod: true },
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
    // Validate pronouns length
    if (pronouns.length > 32) {
      return { 
        success: false, 
        error: "Pronouns must be 32 characters or less" 
      }
    }
    if (inputMethod.length > 100) {
      return { 
        success: false, 
        error: "Input method must be 100 characters or less" 
      }
    }
    // Validate input method
    // Update player bio
    await prisma.player.update({
      where: { id: player.id },
      data: { bio },
    })
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: { pronouns, inputMethod },
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

export async function updatePlayerNationality(countryCode: string | null) {
    try {
        const session = await requireAuth()

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

        const normalized = countryCode?.trim() ?? ""
        const normalizedUpper = normalized === "" ? null : normalized.toUpperCase()

        // Update nationality
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                countryCode: normalizedUpper,
            },
        })

        revalidatePath(`/players/${player.handle}`)
        revalidatePath("/account/settings")

        return { success: true }
    } catch (error) {
        console.error("Error updating nationality:", error)
        return { success: false, error: "Failed to update social links" }
    }
}