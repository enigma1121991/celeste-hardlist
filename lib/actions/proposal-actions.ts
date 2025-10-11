'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProposalType, ProposalStatus, VoteType, RunType } from '@prisma/client'

type CreateProposalInput = {
  type: ProposalType
  title: string
  description: string
  proposalData: any
}

export async function createProposal(input: CreateProposalInput) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return { error: 'You must be signed in to create a proposal' }
    }

    // Check if user has a claimed player
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
    })

    if (!player) {
      return { error: 'You must have a claimed or created player account to create proposals' }
    }

    // Validate proposal data based on type
    if (input.type === 'MAP_DIFFICULTY') {
      const data = input.proposalData
      if (!data.mapId || !data.proposedStars || !data.reasoning) {
        return { error: 'Missing required fields for map difficulty proposal' }
      }

      // Verify map exists
      const map = await prisma.map.findUnique({
        where: { id: data.mapId },
      })

      if (!map) {
        return { error: 'Map not found' }
      }

      // Check if proposed stars are different from current
      if (map.stars === data.proposedStars) {
        return { error: 'Proposed star rating must be different from current rating' }
      }
    } else if (input.type === 'ADD_MAP') {
      const data = input.proposalData
      if (!data.mapName || !data.creatorName || !data.stars || !data.evidenceUrls || data.evidenceUrls.length === 0 || !data.reasoning) {
        return { error: 'Missing required fields for add map proposal' }
      }

      // Check if map already exists
      const existingMap = await prisma.map.findUnique({
        where: { name: data.mapName },
      })

      if (existingMap) {
        return { error: 'A map with this name already exists' }
      }
    } else if (input.type === 'CHANGE_RULE') {
      const data = input.proposalData
      if (!data.currentText || !data.proposedText || !data.reasoning) {
        return { error: 'Missing required fields for rule change proposal' }
      }
    }

    // Create the proposal
    const proposal = await prisma.proposal.create({
      data: {
        createdById: session.user.id,
        type: input.type,
        title: input.title,
        description: input.description,
        proposalData: input.proposalData,
      },
    })

    revalidatePath('/proposals')
    return { success: true, proposalId: proposal.id }
  } catch (error) {
    console.error('Error creating proposal:', error)
    return { error: 'Failed to create proposal' }
  }
}

export async function updateProposalStatus(
  proposalId: string,
  status: ProposalStatus,
  reason?: string
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return { error: 'You must be signed in' }
    }

    // Check if user is admin or mod
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MOD') {
      return { error: 'You do not have permission to update proposal status' }
    }

    const proposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status,
        closedById: session.user.id,
        closedReason: reason,
        closedAt: new Date(),
      },
    })

    revalidatePath('/proposals')
    revalidatePath(`/proposals/${proposalId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating proposal status:', error)
    return { error: 'Failed to update proposal status' }
  }
}

export async function submitVote(
  proposalId: string,
  vote: VoteType,
  forceHighlight?: boolean,
  reasoning?: string
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return { error: 'You must be signed in to vote' }
    }

    // Validate force highlight requires reasoning
    if (forceHighlight && !reasoning) {
      return { error: 'Reasoning is required when requesting vote highlight' }
    }

    // Get the proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!proposal) {
      return { error: 'Proposal not found' }
    }

    // Check if proposal is still open
    if (proposal.status !== 'PENDING') {
      return { error: 'This proposal is no longer accepting votes' }
    }

    // For MAP_DIFFICULTY proposals, check if user has cleared the map
    let hasCleared = false
    if (proposal.type === 'MAP_DIFFICULTY') {
      const proposalData = proposal.proposalData as any
      const fullClearOnly = proposalData.fullClearOnly || false
      
      // Get user's player
      const player = await prisma.player.findUnique({
        where: { userId: session.user.id },
      })

      if (player) {
        const runTypeFilter = fullClearOnly 
          ? {
              type: {
                in: [RunType.FULL_CLEAR_VIDEO, RunType.FULL_CLEAR, RunType.FULL_CLEAR_GB]
              }
            }
          : {
              type: {
                notIn: [RunType.CREATOR_CLEAR]
              }
            }

        const run = await prisma.run.findFirst({
          where: {
            mapId: proposalData.mapId,
            playerId: player.id,
            verifiedStatus: 'VERIFIED',
            ...runTypeFilter,
          },
        })

        hasCleared = !!run
      }
    }

    // Upsert the vote
    await prisma.proposalVote.upsert({
      where: {
        proposalId_userId: {
          proposalId,
          userId: session.user.id,
        },
      },
      update: {
        vote,
        hasCleared,
        forceHighlight: forceHighlight || false,
        reasoning,
      },
      create: {
        proposalId,
        userId: session.user.id,
        vote,
        hasCleared,
        forceHighlight: forceHighlight || false,
        reasoning,
      },
    })

    revalidatePath(`/proposals/${proposalId}`)
    return { success: true }
  } catch (error) {
    console.error('Error submitting vote:', error)
    return { error: 'Failed to submit vote' }
  }
}

export async function removeVote(proposalId: string) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return { error: 'You must be signed in' }
    }

    await prisma.proposalVote.delete({
      where: {
        proposalId_userId: {
          proposalId,
          userId: session.user.id,
        },
      },
    })

    revalidatePath(`/proposals/${proposalId}`)
    return { success: true }
  } catch (error) {
    console.error('Error removing vote:', error)
    return { error: 'Failed to remove vote' }
  }
}

export async function addComment(
  proposalId: string,
  content: string,
  parentId?: string
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return { error: 'You must be signed in to comment' }
    }

    if (!content.trim()) {
      return { error: 'Comment cannot be empty' }
    }

    // If parentId provided, verify it exists and calculate depth
    if (parentId) {
      const parentComment = await prisma.proposalComment.findUnique({
        where: { id: parentId },
        select: { 
          id: true,
          parentId: true,
        },
      })

      if (!parentComment) {
        return { error: 'Parent comment not found' }
      }

      // Calculate depth by counting parent chain (limit to 3 levels)
      let depth = 1
      let currentParentId = parentComment.parentId
      
      while (currentParentId) {
        depth++
        const parent = await prisma.proposalComment.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        })
        currentParentId = parent?.parentId || null
      }

      if (depth >= 2) {
        return { error: 'Maximum comment depth reached' }
      }
    }

    const comment = await prisma.proposalComment.create({
      data: {
        proposalId,
        userId: session.user.id,
        content,
        parentId,
      },
    })

    revalidatePath(`/proposals/${proposalId}`)
    return { success: true, commentId: comment.id }
  } catch (error) {
    console.error('Error adding comment:', error)
    return { error: 'Failed to add comment' }
  }
}

export async function deleteComment(commentId: string) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return { error: 'You must be signed in to delete comments' }
    }

    // Get the comment to verify ownership and get proposalId
    const comment = await prisma.proposalComment.findUnique({
      where: { id: commentId },
      select: { 
        id: true,
        userId: true,
        proposalId: true,
      },
    })

    if (!comment) {
      return { error: 'Comment not found' }
    }
    // Check if user owns the comment
    if (comment.userId !== session.user.id) {
      return { error: 'You can only delete your own comments' }
    }

    // Delete the comment (this will also delete any replies due to cascade)
    await prisma.proposalComment.delete({
      where: { id: commentId },
    })

    revalidatePath(`/proposals/${comment.proposalId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting comment:', error)
    return { error: 'Failed to delete comment' }
  }
}

