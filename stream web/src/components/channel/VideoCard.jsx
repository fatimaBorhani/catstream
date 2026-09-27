import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ImageWithSkeleton from '../common/ImageWithSkeleton'
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

// طول ویدیو تو دیتا برحسب دقیقه ذخیره شده؛ اینجا به شکل خوانا درش میاریم
// (۱۹۶ دقیقه یعنی «3h 16m»، نه یه عدد گنده‌ی بی‌معنی)
function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

// «۳ روز پیش» - همون فرمتی که تو سایت‌های ویدیویی عادیه
function formatUploadedAt(daysAgo) {
  if (daysAgo === 0) return 'today'
  if (daysAgo === 1) return 'yesterday'
  if (daysAgo < 7) return `${daysAgo} days ago`
  const weeks = Math.floor(daysAgo / 7)
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
}

// فاز ۹: onDelete اختیاریه - فقط جاهایی که خودِ صاحب کانال می‌بینه (تب Videos داشبورد)
// این پراپ رو پاس می‌دن. حذف یه کار برگشت‌ناپذیره، پس یه کلیک ساده کافی نیست - دکمه‌ی
// سطل‌آشغال یه ConfirmModal واقعی باز می‌کنه (عین پنجره‌ی تأیید خروج تو Navbar)
function VideoCard({ video, onDelete }) {
  const navigate = useNavigate()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  function handleConfirmDelete() {
    setIsConfirmOpen(false)
    onDelete(video.id)
  }

  // فاز آپلود واقعی: قبلاً کل کارت هیچ کلیکی نداشت چون فایل واقعی برای پخش نبود؛
  // حالا با کلیک می‌ره صفحه‌ی تماشا، حتی اگه این ویدیوی خاص هنوز فایل واقعی نداشته
  // باشه - WatchPage خودش این حالت رو صادقانه نشون می‌ده، نه اینکه اینجا قایمش کنیم
  function handleCardActivate() {
    navigate(`/watch/${video.id}`)
  }

  function handleCardKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleCardActivate()
    }
  }

  // دکمه‌ی حذف تو همون کارتِ کلیک‌پذیره نشسته - بدون stopPropagation، زدنش هم کارت رو
  // به صفحه‌ی تماشا می‌بره هم مودال تأیید حذف رو باز می‌کنه، که گیج‌کننده‌ست
  function handleDeleteClick(event) {
    event.stopPropagation()
    setIsConfirmOpen(true)
  }

  return (
    <div
      className="group cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleCardActivate}
      onKeyDown={handleCardKeyDown}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2">
        <ImageWithSkeleton
          src={video.thumbnailImage}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {formatDuration(video.durationMinutes)}
        </span>

        {onDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            aria-label="Delete video"
            className="absolute left-2 top-2 flex items-center justify-center rounded-md bg-black/70 p-1.5 text-white transition-colors hover:bg-red-500"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-text">{video.title}</p>
      <p className="mt-0.5 text-xs text-text-dim">
        {video.viewCount.toLocaleString()} views · {formatUploadedAt(video.uploadedDaysAgo)}
      </p>

      {isConfirmOpen && (
        <ConfirmModal
          title="Delete this video?"
          message={`"${video.title}" will be permanently removed, along with its likes and its spot in any playlists.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default VideoCard
