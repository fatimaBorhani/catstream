import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import ConfirmModal from '../common/ConfirmModal'

const API_BASE = 'http://localhost:4000/api'
const MAX_TITLE_LENGTH = 100

// «۹۲ ثانیه» رو به شکل خوانای «۱:۳۲» درمیاره - همون فرمتی که یوتیوب/توییچ زیر ویدیو دارن
function formatTimestamp(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function ScissorsIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.5 8.5 19 19M8.5 15.5 19 5" />
    </svg>
  )
}

function TrashIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7h14z" />
    </svg>
  )
}

function LinkIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </svg>
  )
}

// فاز ۱۲: بوکمارک‌های زمانی رو یه ویدیو. عمداً فایل جدا نمی‌سازه - فقط عنوان + ثانیه‌ای
// که به همون لحظه از ویدیوی اصلی اشاره می‌کنه، چون این پروژه هنوز پردازش ویدیو سمت سرور
// (مثل ffmpeg برای بریدن واقعی فایل) نداره.
// getCurrentTime/onJumpTo از WatchPage میان - چون خودِ تگ <video> اونجاست، نه اینجا
function VideoClips({ videoId, channelOwnerId, getCurrentTime, onJumpTo }) {
  const { user, openAuthModal } = useAuth()
  const { showToast } = useToast()
  const [clips, setClips] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingTimestamp, setPendingTimestamp] = useState(null)
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const loadClips = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/clips/${videoId}`)
      if (response.ok) {
        const data = await response.json()
        setClips(data.clips)
      }
    } catch {
      // شبکه قطع بود - لیست خالی می‌مونه، کاربر می‌تونه دوباره باز کنه این تب رو
    } finally {
      setIsLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    setIsLoading(true)
    loadClips()
  }, [loadClips])

  // لحظه‌ای که همین الان دکمه زده شد رو قفل می‌کنیم، نه لحظه‌ی submit - چون تا وقتی
  // داری عنوان کلیپ رو تایپ می‌کنی، ویدیو همچنان داره پخش می‌شه و جلو می‌ره
  function handleOpenForm() {
    if (!user) {
      openAuthModal('login')
      return
    }
    setPendingTimestamp(Math.floor(getCurrentTime()))
    setIsFormOpen(true)
  }

  function handleCancelForm() {
    setIsFormOpen(false)
    setPendingTimestamp(null)
    setTitle('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle || pendingTimestamp === null) return

    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE}/clips/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: trimmedTitle, timestampSeconds: pendingTimestamp }),
      })
      const data = await response.json()
      if (!response.ok) {
        showToast(data.error || 'Could not create the clip', 'error')
        return
      }
      setClips((prevClips) =>
        [...prevClips, data.clip].sort((a, b) => a.timestampSeconds - b.timestampSeconds),
      )
      handleCancelForm()
      showToast('Clip created')
    } catch {
      showToast('Could not reach the server. Is the backend running?', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleConfirmDelete() {
    const clipId = deleteTargetId
    setDeleteTargetId(null)
    try {
      const response = await fetch(`${API_BASE}/clips/${clipId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        showToast('Could not delete the clip', 'error')
        return
      }
      setClips((prevClips) => prevClips.filter((clip) => clip.id !== clipId))
      showToast('Clip deleted')
    } catch {
      showToast('Could not reach the server. Is the backend running?', 'error')
    }
  }

  async function handleCopyLink(clip) {
    // ?t= یعنی «این ویدیو رو از این ثانیه شروع کن» - WatchPage خودش این پارامتر رو
    // موقع لود متادیتای ویدیو می‌خونه و پلیر رو می‌بره همون‌جا
    const shareUrl = `${window.location.origin}/watch/${videoId}?t=${clip.timestampSeconds}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('Clip link copied')
    } catch {
      showToast('Could not copy the link', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-logo text-base font-semibold text-text">Clips</h2>
        <button
          type="button"
          onClick={handleOpenForm}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-dim transition-colors hover:border-accent hover:text-accent"
        >
          <ScissorsIcon className="h-3.5 w-3.5" />
          Clip this moment
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-3"
        >
          <span className="shrink-0 rounded-md bg-surface px-2 py-1.5 font-mono text-xs text-accent">
            at {formatTimestamp(pendingTimestamp ?? 0)}
          </span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            placeholder="Clip title"
            autoFocus
            required
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={isSaving || !title.trim()}
            className="shrink-0 rounded-lg bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleCancelForm}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-text-dim transition-colors hover:text-text"
          >
            Cancel
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-11 w-full animate-pulse rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : clips.length === 0 ? (
        <p className="py-3 text-sm text-text-dim">No clips yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {clips.map((clip) => {
            // سازنده‌ی خودِ کلیپ یا صاحب کانالی که ویدیو زیرشه، هردو می‌تونن پاکش کنن -
            // عین همون الگوی حذف کامنت
            const canDelete =
              user && (user.username === clip.creatorUsername || user.id === channelOwnerId)
            return (
              <div
                key={clip.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => onJumpTo(clip.timestampSeconds)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="shrink-0 rounded-md bg-surface-2 px-2 py-1 font-mono text-xs text-accent">
                    {formatTimestamp(clip.timestampSeconds)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-text">{clip.title}</span>
                  <span className="shrink-0 text-xs text-text-dim">by {clip.creatorUsername}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyLink(clip)}
                  aria-label="Copy clip link"
                  className="shrink-0 rounded-full p-1.5 text-text-dim transition-all hover:bg-surface-2 hover:text-text active:scale-90"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </button>

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(clip.id)}
                    aria-label="Delete clip"
                    className="shrink-0 rounded-full p-1.5 text-text-dim transition-all hover:bg-surface-2 hover:text-red-500 active:scale-90"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {deleteTargetId && (
        <ConfirmModal
          title="Delete this clip?"
          message="This clip bookmark will be permanently removed. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  )
}

export default VideoClips
