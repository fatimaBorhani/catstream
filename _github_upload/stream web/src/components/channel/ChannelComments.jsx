import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import ImageWithSkeleton from '../common/ImageWithSkeleton'
import ConfirmModal from '../common/ConfirmModal'

const API_BASE = 'http://localhost:4000/api'
const MAX_COMMENT_LENGTH = 500

// «چند وقت پیش» رو از createdAt واقعی حساب می‌کنه - عیناً همون فلسفه‌ی uploadedDaysAgo
// تو Video، فقط اینجا چون کامنت‌ها تازه‌تر و پرتکرارترن، واحدهای ریزتر (دقیقه/ساعت) هم داره
function formatCommentDate(createdAt) {
  const secondsAgo = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  if (secondsAgo < 60) return 'just now'
  const minutesAgo = Math.floor(secondsAgo / 60)
  if (minutesAgo < 60) return `${minutesAgo}m ago`
  const hoursAgo = Math.floor(minutesAgo / 60)
  if (hoursAgo < 24) return `${hoursAgo}h ago`
  const daysAgo = Math.floor(hoursAgo / 24)
  return `${daysAgo}d ago`
}

// تب کامنت‌های زیر یه کانال. streamer از ChannelPage میاد - همونجا هم چک شده که وجود داره
function ChannelComments({ streamer }) {
  const { user, openAuthModal } = useAuth()
  const { showToast } = useToast()
  const [comments, setComments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/comments/${streamer.username}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch {
      // شبکه قطع بود - لیست خالی می‌مونه، کاربر می‌تونه خودش دوباره باز کنه این تب رو
    } finally {
      setIsLoading(false)
    }
  }, [streamer.username])

  useEffect(() => {
    setIsLoading(true)
    loadComments()
  }, [loadComments])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!user) {
      openAuthModal('login')
      return
    }
    const trimmedComment = newComment.trim()
    if (!trimmedComment) return

    setIsPosting(true)
    try {
      const response = await fetch(`${API_BASE}/comments/${streamer.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: trimmedComment }),
      })
      const data = await response.json()
      if (!response.ok) {
        showToast(data.error || 'Could not post the comment', 'error')
        return
      }
      // کامنت تازه رو مستقیم اول لیست می‌ذاریم - نیازی به یه fetch کامل دوباره نیست
      setComments((prevComments) => [data.comment, ...prevComments])
      setNewComment('')
    } catch {
      showToast('Could not reach the server. Is the backend running?', 'error')
    } finally {
      setIsPosting(false)
    }
  }

  async function handleConfirmDelete() {
    const commentId = deleteTargetId
    setDeleteTargetId(null)
    try {
      const response = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        showToast('Could not delete the comment', 'error')
        return
      }
      setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId))
      showToast('Comment deleted')
    } catch {
      showToast('Could not reach the server. Is the backend running?', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={newComment}
          onChange={(event) => setNewComment(event.target.value)}
          onFocus={() => {
            if (!user) openAuthModal('login')
          }}
          placeholder={user ? 'Add a comment...' : 'Log in to leave a comment'}
          maxLength={MAX_COMMENT_LENGTH}
          rows={2}
          className="w-full resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-dim">
            {newComment.length}/{MAX_COMMENT_LENGTH}
          </span>
          <button
            type="submit"
            disabled={isPosting || !newComment.trim()}
            className="rounded-full bg-gradient-to-r from-accent to-accent-2 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.03] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {isPosting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-14 w-full animate-pulse rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-dim">
          No comments yet. Be the first to say something.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => {
            // نویسنده‌ی خودِ کامنت یا صاحب همین کانال، هردو می‌تونن این کامنت رو پاک کنن
            const canDelete =
              user && (user.username === comment.authorUsername || user.id === streamer.userId)
            return (
              <div key={comment.id} className="flex items-start gap-3">
                <Link to={`/user/${comment.authorUsername}`} className="shrink-0">
                  <ImageWithSkeleton
                    src={comment.authorAvatarImage}
                    alt={comment.authorUsername}
                    className="h-9 w-9 rounded-full bg-surface-2 object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/user/${comment.authorUsername}`}
                      className="truncate text-sm font-semibold text-text hover:underline"
                    >
                      {comment.authorUsername}
                    </Link>
                    <span className="shrink-0 text-xs text-text-dim">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-text-dim">
                    {comment.content}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(comment.id)}
                    aria-label="Delete comment"
                    className="shrink-0 rounded-full p-1.5 text-text-dim transition-all hover:bg-surface-2 hover:text-red-500 active:scale-90"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7h14z" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {deleteTargetId && (
        <ConfirmModal
          title="Delete comment?"
          message="This comment will be permanently removed. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  )
}

export default ChannelComments
