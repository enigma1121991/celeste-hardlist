import { Prisma } from '@prisma/client'

// Map with creator and run counts
export type MapWithDetails = Prisma.MapGetPayload<{
  include: {
    creator: true
    _count: {
      select: {
        runs: true
      }
    }
  }
}>

// Player with runs (minimal map data for performance)
export type PlayerWithRuns = Prisma.PlayerGetPayload<{
  include: {
    runs: {
      include: {
        map: {
          select: {
            stars: true
          }
        }
      }
    }
    user: {
      select: {
        id: true
        role: true
      }
    }
  }
}>

// Proposal with all relations
export type ProposalWithDetails = Prisma.ProposalGetPayload<{
  include: {
    createdBy: {
      select: {
        id: true
        name: true
        image: true
        discordUsername: true
      }
    }
    closedBy: {
      select: {
        id: true
        name: true
        image: true
      }
    }
    votes: {
      include: {
        user: {
          select: {
            id: true
            name: true
            image: true
            discordUsername: true
          }
        }
      }
    }
    comments: {
      include: {
        user: {
          select: {
            id: true
            name: true
            image: true
            discordUsername: true
          }
        }
        replies: {
          include: {
            user: {
              select: {
                id: true
                name: true
                image: true
                discordUsername: true
              }
            }
          }
        }
      }
    }
    _count: {
      select: {
        votes: true
        comments: true
      }
    }
  }
}>

// Proposal data types
export type MapDifficultyProposalData = {
  mapId: string
  mapName: string
  currentStars: number | null
  proposedStars: number
  reasoning: string
  fullClearOnly: boolean
}

export type AddMapProposalData = {
  mapName: string
  creatorName: string
  stars: number
  evidenceUrls: string[]
  reasoning: string
}

export type ChangeRuleProposalData = {
  currentText: string
  proposedText: string
  reasoning: string
}

export type ProposalData = MapDifficultyProposalData | AddMapProposalData | ChangeRuleProposalData

// Run type labels
export const RUN_TYPE_LABELS: Record<string, string> = {
  FULL_CLEAR_VIDEO: 'Full Clear',
  FULL_CLEAR: 'Full Clear (No Video)',
  CLEAR_VIDEO: 'Clear',
  CLEAR: 'Clear (No Video)',
  FULL_CLEAR_GB: 'Full Clear (Golden)',
  CLEAR_GB: 'Clear (Golden)',
  CREATOR_CLEAR: 'Creator Clear',
  CREATOR_FULL_CLEAR: 'Creator Full Clear',
  CREATOR_GOLDEN: 'Creator Golden',
  CREATOR_FULL_CLEAR_GOLDEN: 'Creator Full Clear (Golden)',
  GOLDEN_AND_FULL_CLEAR: 'Golden (Regular Clear) & Full Clear',
  CLEAR_VIDEO_AND_FC: 'Clear Video & FC (No Video)',
  ALL_DEATHLESS_SEGMENTS: 'All Deathless Segments',
  UNKNOWN: 'Unknown',
}

// GM tier labels
export const GM_TIER_LABELS: Record<string, string> = {
  GM1: 'GM+1',
  GM2: 'GM+2',
  GM3: 'GM+3',
}

// Proposal type labels
export const PROPOSAL_TYPE_LABELS: Record<string, string> = {
  MAP_DIFFICULTY: 'Map Difficulty',
  ADD_MAP: 'Add Map',
  CHANGE_RULE: 'Change Rule',
}

// Proposal status labels
export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED_VETOED: 'Rejected (Vetoed)',
  REJECTED_VOTES: 'Rejected (Not Enough Votes)',
}

// Vote type labels
export const VOTE_TYPE_LABELS: Record<string, string> = {
  YES: 'Yes',
  NO: 'No',
  INDIFFERENT: 'Indifferent',
}

