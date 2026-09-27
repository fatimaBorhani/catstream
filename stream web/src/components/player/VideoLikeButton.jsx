import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

// قلب خطی، هم‌خانواده‌ی بقیه‌ی آیکون‌های سایت (نه ایموجی). وقتی لایک شده، همین مسیر با
// fill پر می‌شه - به‌جای اینکه دوتا آیکون جدا داشته باشیم که ممکنه شکلشون کمی فرق کنه
function HeartIcon({ className, isFilled }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20s-7-4.5-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5c0 5-7 9.5-7 9.5z" />
    </svg>
  )
}

// فاز ۱۶: مدل Like و روت‌هاش از فاز ۳ آماده بودن ولی هیچ دکمه‌ای بهشون وصل نبود.
// خودِ «لایک شده یا نه» تو AuthContext زندگی می‌کنه (عین follows)، ولی عددِ کنارش از
// DataContext میاد که فقط موقع بالا اومدن اپ تازه می‌شه
function VideoLikeButton({ videoId, likeCount }) {
  const { user, isLiked, toggleLike, openAuthModal } = useAuth()
  const { showToast } = useToast()

  // اگه مستقیم likeCount رو نشون بدیم، بعد از کلیک عدد تکون نمی‌خوره (چون لیست ویدیوها
  // تازه نشده) و کاربر فکر می‌کنه لایکش ثبت نشده. برای همین یه کپی محلی نگه می‌داریم که
  // بلافاصله بالا/پایین می‌ره
  const [count, setCount] = useState(likeCount)

  // ولی این کپی نباید برای همیشه از سرور جدا بمونه: هر وقت لیست ویدیوها واقعاً از سرور
  // تازه شد، عدد محلی هم باید با عدد واقعی هماهنگ بشه
  useEffect(() => {
    setCount(likeCount)
  }, [likeCount])

  const liked = user ? isLiked(videoId) : false

  async function handleClick() {
    // بدون لاگین، کلیک باید مودال لاگین رو باز کنه نه اینکه الکی لایک کنه - عین همون
    // رفتار دکمه‌ی فالو تو ChannelPage
    if (!user) {
      openAuthModal('login')
      return
    }

    const wasLiked = liked
    setCount((prevCount) => (wasLiked ? prevCount - 1 : prevCount + 1))

    const ok = await toggleLike(videoId)
    if (!ok) {
      // خودِ AuthContext حالت لایک رو برگردونده عقب؛ اینجا فقط عدد رو برمی‌گردونیم
      setCount((prevCount) => (wasLiked ? prevCount + 1 : prevCount - 1))
      showToast('Could not save your like', 'error')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={liked ? 'Remove like' : 'Like this video'}
      className={
        liked
          ? 'flex items-center gap-1.5 rounded-full border border-accent px-3 py-1.5 text-xs font-semibold text-accent transition-all active:scale-95'
          : 'flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-dim transition-all hover:border-accent hover:text-accent active:scale-95'
      }
    >
      <HeartIcon className="h-3.5 w-3.5" isFilled={liked} />
      {count.toLocaleString()}
    </button>
  )
}

export default VideoLikeButton
