'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProposalComment } from '@prisma/client'
import { UserRole } from '@prisma/client'
import RoleBadge from '@/components/RoleBadge'
import Link from 'next/link'
import Image from 'next/image'

type CommentWithUser = ProposalComment & {
  user: {
    role: UserRole
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
  originalPosterId: string
  currentUserRole: UserRole
  userImage: string | null
}

interface CommentItemProps {
  comment: CommentWithUser
  proposalId: string
  currentUserId?: string
  originalPosterId: string
  depth: number
  onReply: () => void
  currentUserRole: UserRole
}

function CommentItem({ comment, proposalId, currentUserId, depth, onReply, originalPosterId,currentUserRole }: CommentItemProps) {
  const router = useRouter()
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isUpdating, setIsUpdating] = useState(false)

  const canReply = depth < 2
  const ownsComment = currentUserId === comment.user.id
  const isModerator = currentUserRole === 'MOD' || currentUserRole === 'ADMIN'

  const MAX_COMMENT_LENGTH = 2000
  const isOverLimit = replyContent.length > MAX_COMMENT_LENGTH
  const isNearLimit = replyContent.length > MAX_COMMENT_LENGTH * 0.8
  const isEditOverLimit = editContent.length > MAX_COMMENT_LENGTH
  const isEditNearLimit = editContent.length > MAX_COMMENT_LENGTH * 0.8

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return
    
    if (isOverLimit) {
      alert(`Reply is too long. Maximum ${MAX_COMMENT_LENGTH} characters allowed.`)
      return
    }

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

  const handleUpdateComment = async () => {
    if (!editContent.trim()) return
    
    if (isEditOverLimit) {
      alert(`Comment is too long. Maximum ${MAX_COMMENT_LENGTH} characters allowed.`)
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch(`/api/proposals/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to update comment')
        return
      }

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('Failed to update comment')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/proposals/comments/${comment.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to delete comment')
        return
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    } finally {
      setIsDeleting(false)
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {comment.user.image && (
            <Image
                src={comment.user.image || ""}
                alt={''}
                width={24}
                height={24}
                className="rounded-full"
            ></Image>
            )}
            <Link href={`/players/${encodeURIComponent(comment.user.name || "")}`} className="text-sm font-medium text-[var(--foreground)]">
              {comment.user.name || comment.user.discordUsername || 'Unknown'} 
            </Link>
            {comment.user && <RoleBadge role={comment.user.role} size="sm" />}
            {comment.user.id == originalPosterId && <span 
            className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full font-semibold border bg-blue-500/20 text-blue-400 border-blue-500/50`}>OP
            </span>}
            <span className="text-xs text-[var(--foreground-muted)]">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          
          {/* Action Buttons */}
          {(ownsComment || isModerator) && (
            <div className="flex gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={handleDeleteComment}
                disabled={isDeleting}
                className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={`w-full px-3 py-2 bg-[var(--background)] border rounded text-[var(--foreground)] text-sm resize-none ${
                  isEditOverLimit 
                    ? 'border-red-500 focus:border-red-500' 
                    : isEditNearLimit 
                    ? 'border-yellow-500 focus:border-yellow-500' 
                    : 'border-[var(--border)] focus:border-blue-500'
                }`}
                rows={3}
              />
              {/* Character Counter */}
              <div className="absolute bottom-1 right-1 text-xs">
                <span className={`${
                  isEditOverLimit 
                    ? 'text-red-400' 
                    : isEditNearLimit 
                    ? 'text-yellow-400' 
                    : 'text-[var(--foreground-muted)]'
                }`}>
                  {editContent.length}/{MAX_COMMENT_LENGTH}
                </span>
              </div>
            </div>
            
            {/* Character Limit Warning */}
            {isEditOverLimit && (
              <div className="text-xs text-red-400">
                Comment exceeds character limit. Please shorten your message.
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleUpdateComment}
                disabled={isUpdating || !editContent.trim() || isEditOverLimit}
                className="px-3 py-1.5 bg-white text-black border border-gray-300 rounded text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(comment.content)
                }}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded text-sm hover:bg-[var(--background-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap break-words overflow-wrap-anywhere mb-2">
            {comment.content}
          </div>
        )}

        {/* Reply Button */}
        {currentUserId && canReply && !isReplying && !isEditing && (
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Reply
          </button>
        )}

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-3 space-y-2">
            <div className="relative">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className={`w-full px-3 py-2 bg-[var(--background)] border rounded text-[var(--foreground)] text-sm resize-none ${
                  isOverLimit 
                    ? 'border-red-500 focus:border-red-500' 
                    : isNearLimit 
                    ? 'border-yellow-500 focus:border-yellow-500' 
                    : 'border-[var(--border)] focus:border-blue-500'
                }`}
                rows={3}
              />
              {/* Character Counter */}
              <div className="absolute bottom-1 right-1 text-xs">
                <span className={`${
                  isOverLimit 
                    ? 'text-red-400' 
                    : isNearLimit 
                    ? 'text-yellow-400' 
                    : 'text-[var(--foreground-muted)]'
                }`}>
                  {replyContent.length}/{MAX_COMMENT_LENGTH}
                </span>
              </div>
            </div>
            
            {/* Character Limit Warning */}
            {isOverLimit && (
              <div className="text-xs text-red-400">
                Reply exceeds character limit. Please shorten your message.
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleSubmitReply}
                disabled={isSubmitting || !replyContent.trim() || isOverLimit}
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
              originalPosterId={originalPosterId}
              currentUserRole={currentUserRole}
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
  originalPosterId,
  currentUserRole
}: ProposalDiscussionProps) {
  const router = useRouter()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const MAX_COMMENT_LENGTH = 2000
  const isOverLimit = newComment.length > MAX_COMMENT_LENGTH
  const isNearLimit = newComment.length > MAX_COMMENT_LENGTH * 0.8

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    
    if (isOverLimit) {
      alert(`Comment is too long. Maximum ${MAX_COMMENT_LENGTH} characters allowed.`)
      return
    }

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
        Discussion ({comments.reduce((count, c) => 
            count + 1 + (c.replies ? c.replies.reduce(
            (rCount, r) => rCount + 1 + (r.replies ? r.replies.length : 0),
            0) : 0), 0)})
      </h3>

      {/* New Comment Form */}
      {currentUserId && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className={`w-full px-4 py-3 bg-[var(--background-elevated)] border rounded-lg text-[var(--foreground)] resize-none ${
                isOverLimit 
                  ? 'border-red-500 focus:border-red-500' 
                  : isNearLimit 
                  ? 'border-yellow-500 focus:border-yellow-500' 
                  : 'border-[var(--border)] focus:border-blue-500'
              }`}
              rows={4}
            />
            {/* Character Counter */}
            <div className="absolute bottom-2 right-2 text-xs">
              <span className={`${
                isOverLimit 
                  ? 'text-red-400' 
                  : isNearLimit 
                  ? 'text-yellow-400' 
                  : 'text-[var(--foreground-muted)]'
              }`}>
                {newComment.length}/{MAX_COMMENT_LENGTH}
              </span>
            </div>
          </div>
          
          {/* Character Limit Warning */}
          {isOverLimit && (
            <div className="text-sm text-red-400">
              Comment exceeds character limit. Please shorten your message.
            </div>
          )}
          
          <button
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim() || isOverLimit}
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
              originalPosterId={originalPosterId}
              depth={1}
              onReply={() => {}}
              currentUserRole={currentUserRole}
            />
          ))}
        </div>
      )}
    </div>
  )
}

