import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { useData } from '../../context/DataContext'
import UploadVideoForm from './UploadVideoForm'
import NewPlaylistForm from './NewPlaylistForm'

const API_BASE = 'http://localhost:4000/api'

function BroadcastIcon({ className }) {
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
      <circle cx="12" cy="12" r="2" />
      <path d="M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
      <path d="M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2" />
    </svg>
  )
}

function UploadIcon({ className }) {
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
      <path d="M12 16V4" />
      <path d="m8 8 4-4 4 4" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  )
}

function PlaylistIcon({ className }) {
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
      <path d="M4 7h12M4 12h12M4 17h7" />
      <path d="M19 13v6M16 16h6" />
    </svg>
  )
}

// فاز ۴: قبلاً هر سه دکمه فقط یه توست ثابت نشون می‌دادن (چون هنوز مدلی تو دیتابیس نبود).
// حالا واقعاً کار می‌کنن: Go live مستقیم وضعیت لایو بودن کانال رو عوض می‌کنه، اون دوتای دیگه
// یه فرم کوچیک زیر همین کارت‌ها باز می‌کنن - expandedForm مشخص می‌کنه کدوم فرم بازه (یا هیچ‌کدوم)
function StudioActions({ streamer, channelVideos }) {
  const { showToast } = useToast()
  const { refreshData } = useData()
  const [expandedForm, setExpandedForm] = useState(null)
  const [isTogglingLive, setIsTogglingLive] = useState(false)

  // هر سه دکمه به یه کانال واقعی نیاز دارن - اگه کاربر هنوز کانالی نداره (تب "No channel yet")
  // به‌جای تلاش برای زدن یه درخواست بی‌فایده، همینجا جلوش رو می‌گیریم
  function requireChannel() {
    if (!streamer) {
      showToast('You need a channel before you can do that', 'error')
      return false
    }
    return true
  }

  async function handleGoLiveToggle() {
    if (!requireChannel()) return

    setIsTogglingLive(true)
    try {
      const endpoint = streamer.isLive ? 'go-offline' : 'go-live'
      const response = await fetch(`${API_BASE}/streamers/me/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()
      if (!response.ok) {
        showToast(data.error || 'Could not update your live status', 'error')
        return
      }
      await refreshData()
      showToast(streamer.isLive ? 'Stream ended' : "You're live!")
    } catch {
      showToast('Could not reach the server. Is the backend running?', 'error')
    } finally {
      setIsTogglingLive(false)
    }
  }

  function toggleForm(formId) {
    if (!requireChannel()) return
    // اگه همون فرمی که بازه رو دوباره بزنی جمعش می‌کنه، وگرنه فرم قبلی بسته می‌شه
    // و این یکی باز می‌شه - همیشه حداکثر یه فرم باز می‌مونه
    setExpandedForm((currentForm) => (currentForm === formId ? null : formId))
  }

  function handleFormDone() {
    setExpandedForm(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleGoLiveToggle}
          disabled={isTogglingLive}
          className="relative rounded-2xl border border-cat-pink/30 bg-cat-pink/10 p-5 text-left transition-transform hover:z-10 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cat-pink text-white">
            <BroadcastIcon className="h-5 w-5" />
          </span>
          <span className="mt-3 block font-logo text-base font-semibold text-text">
            {streamer?.isLive ? 'End stream' : 'Go live'}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-text-dim">
            {streamer?.isLive
              ? 'Stop broadcasting and take the channel offline.'
              : 'Start streaming with your current title and category.'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => toggleForm('upload')}
          className="relative rounded-2xl border border-accent/30 bg-accent/10 p-5 text-left transition-transform hover:z-10 hover:scale-[1.02] active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
            <UploadIcon className="h-5 w-5" />
          </span>
          <span className="mt-3 block font-logo text-base font-semibold text-text">
            Upload video
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-text-dim">
            Add a title, thumbnail and duration to publish.
          </span>
        </button>

        <button
          type="button"
          onClick={() => toggleForm('playlist')}
          className="relative rounded-2xl border border-cat-violet/30 bg-cat-violet/10 p-5 text-left transition-transform hover:z-10 hover:scale-[1.02] active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cat-violet text-white">
            <PlaylistIcon className="h-5 w-5" />
          </span>
          <span className="mt-3 block font-logo text-base font-semibold text-text">
            New playlist
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-text-dim">
            Group your videos into a series.
          </span>
        </button>
      </div>

      {expandedForm === 'upload' && (
        <UploadVideoForm onCancel={handleFormDone} onSaved={handleFormDone} />
      )}

      {expandedForm === 'playlist' && (
        <NewPlaylistForm
          channelVideos={channelVideos}
          onCancel={handleFormDone}
          onSaved={handleFormDone}
        />
      )}
    </div>
  )
}

export default StudioActions
