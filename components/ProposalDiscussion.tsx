'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProposalComment } from '@prisma/client'

type CommentWithUser = ProposalComment & {
  user: {
    id: string
    name: string | null
    image: string | null
    discordUsername: string | null
  }
  replies?: CommentWithUser[]
}

interface ProposalDiscussionProps {
  proposalId: string
  comments: CommentWithUser[]
  currentUserId?: string
}

interface CommentItemProps {
  comment: CommentWithUser
  proposalId: string
  currentUserId?: string
  depth: number
  onReply: () => void
}

function CommentItem({ comment, proposalId, currentUserId, depth, onReply }: CommentItemProps) {
  const router = useRouter()
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canReply = depth < 3

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/proposals/${proposalId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parentId: comment.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to post reply')
        return
      }

      setReplyContent('')
      setIsReplying(false)
      router.refresh()
      onReply()
    } catch (error) {
      console.error('Error posting reply:', error)
      alert('Failed to post reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-3">
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-4">
        {/* Comment Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            {comment.user.name || comment.user.discordUsername || 'Unknown'}
          </span>
          <span className="text-xs text-[var(--foreground-muted)]">
            {formatDate(comment.createdAt)}
          </span>
        </div>

        {/* Comment Content */}
        <div className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap mb-2">
          {comment.content}
        </div>

        {/* Reply Button */}
        {currentUserId && canReply && (
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isReplying ? 'Cancel' : 'Reply'}
          </button>
        )}

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-3 space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmitReply}
                disabled={isSubmitting || !replyContent.trim()}
                className="px-3 py-1.5 bg-white text-black border border-gray-300 rounded text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post Reply'}
              </button>
              <button
                onClick={() => setIsReplying(false)}
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded text-sm hover:bg-[var(--background-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 space-y-3 border-l-2 border-[var(--border)] pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              proposalId={proposalId}
              currentUserId={currentUserId}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProposalDiscussion({
  proposalId,
  comments,
  currentUserId,
}: ProposalDiscussionProps) {
  const router = useRouter()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/proposals/${proposalId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to post comment')
        return
      }

      setNewComment('')
      router.refresh()
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[var(--foreground)]">
        Discussion ({comments.length})
      </h3>

      {/* New Comment Form */}
      {currentUserId && (
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full px-4 py-3 bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg text-[var(--foreground)] resize-none"
            rows={4}
          />
          <button
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim()}
            className="px-6 py-2 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              proposalId={proposalId}
              currentUserId={currentUserId}
              depth={1}
              onReply={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  )
}

