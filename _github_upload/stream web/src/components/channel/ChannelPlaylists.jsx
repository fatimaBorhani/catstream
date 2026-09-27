import { useState } from 'react'
import ImageWithSkeleton from '../common/ImageWithSkeleton'
import EmptyPanel from '../dashboard/EmptyPanel'
import ConfirmModal from '../common/ConfirmModal'

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
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

// دکمه‌ی حذف + پنجره‌ی تأیید واقعی (عین VideoCard) - جدا شده چون state باز/بسته بودن
// مودال مال خودِ همین یه ردیف پلی‌لیسته، نه کل لیست
function PlaylistDeleteButton({ playlistTitle, onConfirm }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  function handleConfirmDelete() {
    setIsConfirmOpen(false)
    onConfirm()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        aria-label="Delete playlist"
        className="absolute left-1 top-1 flex items-center justify-center rounded-md bg-black/70 p-1.5 text-white transition-colors hover:bg-red-500"
      >
        <TrashIcon className="h-3.5 w-3.5" />
      </button>

      {isConfirmOpen && (
        <ConfirmModal
          title="Delete this playlist?"
          message={`"${playlistTitle}" will be removed. Its videos stay on your channel, just not grouped together anymore.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmOpen(false)}
        />
      )}
    </>
  )
}

// هر پلی‌لیست فقط id ویدیوهاشو داره، پس اینجا از روی لیست کامل ویدیوها پیداشون می‌کنیم
// و کاور پلی‌لیست رو از تامبنیل اولین ویدیوش می‌سازیم (مثل یوتیوب).
// فاز ۹: onDelete اختیاریه - فقط داشبورد خودِ صاحب کانال این پراپ رو پاس می‌ده
function ChannelPlaylists({ playlists, videos, onDelete }) {
  if (playlists.length === 0) {
    return (
      <EmptyPanel
        title="No playlists yet"
        message="When this channel groups videos into a series, the playlists show up here."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {playlists.map((playlist) => {
        const playlistVideos = playlist.videoIds
          .map((videoId) => videos.find((video) => video.id === videoId))
          .filter(Boolean)
        const coverVideo = playlistVideos[0]

        return (
          <div
            key={playlist.id}
            className="flex gap-3 rounded-2xl border border-border bg-surface p-3"
          >
            <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-surface-2">
              {coverVideo && (
                <ImageWithSkeleton
                  src={coverVideo.thumbnailImage}
                  alt={playlist.title}
                  className="h-full w-full object-cover"
                />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[10px] font-medium text-white">
                {playlistVideos.length}{' '}
                {playlistVideos.length === 1 ? 'video' : 'videos'}
              </span>
              {onDelete && (
                <PlaylistDeleteButton
                  playlistTitle={playlist.title}
                  onConfirm={() => onDelete(playlist.id)}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-logo text-sm font-semibold text-text">{playlist.title}</p>
              <ul className="mt-1.5 space-y-0.5">
                {playlistVideos.slice(0, 2).map((video) => (
                  <li key={video.id} className="truncate text-xs text-text-dim">
                    {video.title}
                  </li>
                ))}
                {playlistVideos.length > 2 && (
                  <li className="text-xs text-accent">
                    +{playlistVideos.length - 2} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ChannelPlaylists
