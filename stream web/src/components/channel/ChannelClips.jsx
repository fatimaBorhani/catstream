import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ImageWithSkeleton from '../common/ImageWithSkeleton'
import EmptyPanel from '../dashboard/EmptyPanel'

const API_BASE = 'http://localhost:4000/api'

// «۹۲ ثانیه» رو به «۱:۳۲» تبدیل می‌کنه - همون تابعی که VideoClips هم داره. عمداً کپی شده
// و مشترک نشده چون هنوز فقط دو تا مصرف‌کننده داره و ساختن یه فایل utils برای سه خط،
// بیشتر از چیزی که حل کنه پیچیدگی اضافه می‌کرد
function formatTimestamp(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

// فاز ۱۸: تب Clips صفحه‌ی کانال. کلیپ‌های همه‌ی ویدیوهای این کانال یکجا، تازه‌ترین اول.
// برخلاف VideoClips (که کنار پلیر می‌شینه و می‌تونه به لحظه‌ی مورد نظر بپره)، اینجا خبری
// از پلیر نیست - پس هر کلیپ فقط یه لینک به صفحه‌ی تماشا با ?t= ئه
function ChannelClips({ streamerId }) {
  const [clips, setClips] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadClips() {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE}/clips?streamerId=${streamerId}`)
        if (response.ok) {
          const data = await response.json()
          setClips(data.clips)
        }
      } catch {
        // شبکه قطع بود - لیست خالی می‌مونه، عین بقیه‌ی لیست‌های سایت
      } finally {
        setIsLoading(false)
      }
    }
    loadClips()
  }, [streamerId])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 w-full animate-pulse rounded-lg bg-surface-2" />
        ))}
      </div>
    )
  }

  if (clips.length === 0) {
    return (
      <EmptyPanel
        title="No clips yet"
        message="Clips people create while watching this channel's videos will show up here."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {clips.map((clip) => (
        <Link
          key={clip.id}
          to={`/watch/${clip.videoId}?t=${clip.timestampSeconds}`}
          className="group flex flex-col gap-2"
        >
          <div className="relative overflow-hidden rounded-lg">
            <ImageWithSkeleton
              src={clip.videoThumbnail}
              alt={clip.title}
              className="aspect-video w-full bg-surface-2 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* مهر زمان روی تامبنیل - همون جایی که مدت‌زمان ویدیو تو VideoCard می‌شینه،
                تا چشم کاربر بین این دو تا لیست سرگردون نشه */}
            <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-xs text-white">
              {formatTimestamp(clip.timestampSeconds)}
            </span>
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text group-hover:text-accent">
              {clip.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-text-dim">
              from {clip.videoTitle}
            </p>
            <p className="mt-0.5 truncate text-xs text-text-dim">by {clip.creatorUsername}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default ChannelClips
