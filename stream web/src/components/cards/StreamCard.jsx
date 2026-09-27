import { Link } from 'react-router-dom'
import ImageWithSkeleton from '../common/ImageWithSkeleton'

function StreamCard({
  thumbnailImage,
  avatarImage,
  username,
  streamTitle,
  categoryName,
  viewerCount,
  isLive,
}) {
  return (
    <Link
      to={`/channel/${username}`}
      className="group block transition-transform duration-150 active:scale-[0.98]"
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-2">
        <ImageWithSkeleton
          src={thumbnailImage}
          alt={streamTitle}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {isLive && (
          <span className="absolute left-2 top-2 rounded bg-online/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bg">
            Live
          </span>
        )}

        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {viewerCount.toLocaleString()} viewers
        </span>
      </div>

      <div className="mt-2 flex gap-2">
        <ImageWithSkeleton
          src={avatarImage}
          alt={username}
          className="h-9 w-9 shrink-0 rounded-full bg-surface-2 object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text transition-colors group-hover:text-accent">
            {streamTitle}
          </p>
          <p className="truncate text-xs text-text-dim">{username}</p>
          <p className="truncate font-brand text-xs text-text-dim">{categoryName}</p>
        </div>
      </div>
    </Link>
  )
}

export default StreamCard
