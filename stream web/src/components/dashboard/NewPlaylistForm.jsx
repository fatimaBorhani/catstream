import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { useData } from '../../context/DataContext'
import EmptyPanel from './EmptyPanel'

const API_BASE = 'http://localhost:4000/api'

// فاز ۴: فرم ساخت پلی‌لیست. ترتیب ویدیوها تو پلی‌لیست همون ترتیبیه که تیک می‌زنی
// (اولین تیک = ویدیوی اول) - جابه‌جا کردن دستی بعد از ساخت یه فاز جدا و بزرگ‌تره،
// فعلاً لازم نیست بزنیمش
function NewPlaylistForm({ channelVideos, onCancel, onSaved }) {
  const [title, setTitle] = useState('')
  const [selectedVideoIds, setSelectedVideoIds] = useState([])
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()
  const { refreshData } = useData()

  function toggleVideo(videoId) {
    setSelectedVideoIds((prevIds) =>
      prevIds.includes(videoId) ? prevIds.filter((id) => id !== videoId) : [...prevIds, videoId],
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (selectedVideoIds.length === 0) {
      setError('Pick at least one video')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, videoIds: selectedVideoIds }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Could not create the playlist')
        return
      }
      await refreshData()
      showToast('Playlist created')
      onSaved()
    } catch {
      setError('Could not reach the server. Is the backend running?')
    } finally {
      setIsSaving(false)
    }
  }

  // بدون حداقل یه ویدیو، پلی‌لیست معنی نداره - به‌جای فرم، یه پیام راهنما نشون می‌دیم
  if (channelVideos.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface-2 p-5">
        <EmptyPanel
          title="No videos yet"
          message="Upload at least one video before you can group it into a playlist."
        />
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-2 p-5"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">Title</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">
          Videos ({selectedVideoIds.length} selected)
        </span>
        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-surface p-2">
          {channelVideos.map((video) => (
            <label
              key={video.id}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-text hover:bg-surface-2"
            >
              <input
                type="checkbox"
                checked={selectedVideoIds.includes(video.id)}
                onChange={() => toggleVideo(video.id)}
                className="h-4 w-4 accent-accent"
              />
              <span className="truncate">{video.title}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-dim transition-colors hover:text-text"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-gradient-to-r from-accent to-accent-2 px-5 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {isSaving ? 'Creating...' : 'Create playlist'}
        </button>
      </div>
    </form>
  )
}

export default NewPlaylistForm
