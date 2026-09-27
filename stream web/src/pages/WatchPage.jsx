import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useRef, useEffect, useCallback } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import ImageWithSkeleton from '../components/common/ImageWithSkeleton'
import ShareMenu from '../components/common/ShareMenu'
import VideoClips from '../components/player/VideoClips'
import VideoLikeButton from '../components/player/VideoLikeButton'

const API_BASE = 'http://localhost:4000/api'

// «۱ views» غلط بود. مفرد/جمع رو درست می‌کنیم چون این عدد حالا واقعیه و مدام عوض می‌شه،
// پس حالت ۱ واقعاً پیش میاد (قبلاً همه‌ی عددها از seed و بزرگ بودن)
function formatViews(viewCount) {
  return viewCount === 1 ? '1 view' : `${viewCount.toLocaleString()} views`
}

// uploadedDaysAgo رو سرور از رو createdAt واقعی حساب می‌کنه؛ اینجا فقط خواناش می‌کنیم
function formatUploadedAgo(daysAgo) {
  if (daysAgo <= 0) return 'today'
  if (daysAgo === 1) return '1 day ago'
  return `${daysAgo} days ago`
}

// فاز آپلود واقعی: صفحه‌ی جدای تماشای یه ویدیوی VOD. قبلاً کارت ویدیو هیچ‌جا کلیک‌پذیر
// نبود چون فایل واقعی‌ای نبود که پخش بشه؛ این صفحه یه URL مستقل (بر پایه‌ی videoId) داره
// - نه یه مودال - چون فاز ۱۲ (Clips) باید بتونه به یه لحظه‌ی مشخص از یه ویدیوی مشخص
// لینک بده، و اون فقط با یه آدرس واقعی ممکنه
function WatchPage() {
  const { videoId } = useParams()
  const [searchParams] = useSearchParams()
  const { videos, isLoading, getStreamerByUsername } = useData()
  const { user, isFollowing, toggleFollow, openAuthModal } = useAuth()
  // videoRef بالای کامپوننته (نه داخل یه if)، چون Hookها همیشه باید تو یه ترتیب ثابت
  // صدا زده بشن - حتی وقتی isLoading/video هنوز آماده نیستن
  const videoRef = useRef(null)
  // آخرین ویدیویی که براش بازدید فرستادیم. ref ئه نه state، چون عوض شدنش نباید باعث
  // رندر دوباره بشه
  const countedVideoIdRef = useRef(null)

  // فاز ۱۶: باز شدن این صفحه یعنی یه بازدید. دو تا نکته اینجا هست:
  // ۱) StrictMode تو حالت dev هر افکت رو عمداً دوبار اجرا می‌کنه؛ بدون این نگهبان، هر
  //    بازدید دوتا شمرده می‌شد.
  // ۲) نگهبان خودِ id رو نگه می‌داره نه یه true ساده، وگرنه وقتی از این صفحه به ویدیوی
  //    بعدی می‌رفتی، بازدید اون یکی دیگه هیچ‌وقت شمرده نمی‌شد.
  // خطا رو هم بی‌صدا رد می‌کنیم - شمرده نشدن یه بازدید نباید تجربه‌ی تماشا رو خراب کنه
  useEffect(() => {
    if (countedVideoIdRef.current === videoId) return
    countedVideoIdRef.current = videoId

    fetch(`${API_BASE}/videos/${videoId}/view`, { method: 'POST' }).catch(() => {})
  }, [videoId])

  // وقتی متادیتای فایل لود شد (یعنی seek کردن دیگه ممکنه)، اگه لینک با ?t=xx باز شده بود
  // (مثلاً از رو یه لینک کلیپ که تو VideoClips ساخته می‌شه)، پلیر رو مستقیم می‌بریم همون‌جا
  const handleLoadedMetadata = useCallback(() => {
    const startAt = Number(searchParams.get('t'))
    if (videoRef.current && Number.isFinite(startAt) && startAt > 0) {
      videoRef.current.currentTime = startAt
    }
  }, [searchParams])

  // این دوتا به VideoClips پاس داده می‌شن - چون خودِ تگ <video> اینجاست نه اونجا،
  // VideoClips از این طریق می‌تونه بفهمه الان پلیر رو چه ثانیه‌ایه، یا بهش بگه بپر یه جای دیگه
  function handleJumpTo(seconds) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds
      videoRef.current.play()
    }
  }

  function getCurrentTime() {
    return videoRef.current ? videoRef.current.currentTime : 0
  }

  // مثل ChannelPage: تا لیست ویدیوها از سرور نرسیده، زودتر از موعد "Video not found"
  // نشون نمی‌دیم
  if (isLoading) {
    return (
      <div className="mx-auto aspect-video w-full max-w-5xl animate-pulse rounded-lg bg-surface-2" />
    )
  }

  const video = videos.find((item) => item.id === videoId)
  if (!video) {
    return (
      <div>
        <p className="mb-3 text-text-dim">Video not found.</p>
        <Link to="/" className="text-accent">
          Back to home
        </Link>
      </div>
    )
  }

  const streamer = getStreamerByUsername(video.streamerUsername)

  // بدون لاگین، کلیک روی فالو باید مودال لاگین رو باز کنه نه اینکه الکی فالو کنه -
  // عیناً همون handleFollowClick تو ChannelPage
  function handleFollowClick() {
    if (!user) {
      openAuthModal('login')
      return
    }
    toggleFollow(streamer.id)
  }

  const isFollowingChannel = user && streamer ? isFollowing(streamer.id) : false
  // فالو کردن کانال خودت بی‌معنیه، پس دکمه‌ش اصلاً نباید دیده بشه (سرور هم مستقلاً
  // جلوش رو می‌گیره - این فقط برای اینه که کاربر اصلاً وسوسه نشه)
  const isOwnChannel = Boolean(user && streamer && streamer.userId === user.id)

  return (
    // max-w عمداً اضافه شد: قبلاً محتوا تا آخر عرض صفحه کش می‌اومد و عنوان و دکمه‌ها
    // دو سر یه فضای خالی بزرگ می‌افتادن. حالا مثل یوتیوب یه ستون با عرض معقول داریم
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        {video.videoUrl ? (
          <video
            ref={videoRef}
            src={video.videoUrl}
            controls
            autoPlay
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            className="h-full w-full"
          />
        ) : (
          // ویدیوهای seed‌شده‌ی قدیمی فایل واقعی ندارن (از قبل فاز آپلود واقعی ساخته شدن) -
          // به‌جای یه پلیر خالی/خراب، صادقانه می‌گیم چرا پخش نمی‌شه
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-text-dim">
            This is sample data without a real video file.
          </div>
        )}
      </div>

      {/* عنوان تنها و تمام‌عرض می‌شینه، نه هم‌ردیف دکمه‌ها: عنوان بلند دیگه دکمه‌ها رو
          هل نمی‌ده و همیشه کامل خونده می‌شه */}
      <div>
        <h1 className="font-logo text-xl font-semibold leading-snug text-text">
          {video.title}
        </h1>
        <p className="mt-1 text-sm text-text-dim">
          {formatViews(video.viewCount)} · {formatUploadedAgo(video.uploadedDaysAgo)}
        </p>
      </div>

      {/* کارت کانال: هویت کانال سمت چپ، همه‌ی کنش‌ها سمت راست. قبلاً این صفحه اصلاً
          آواتار و دکمه‌ی فالو نداشت - یعنی از تو صفحه‌ی تماشا هیچ راهی برای فالو کردن
          صاحب ویدیو نبود و کاربر مجبور بود اول برگرده به صفحه‌ی کانال */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        {streamer && (
          <Link to={`/channel/${streamer.username}`} className="flex min-w-0 items-center gap-3">
            <ImageWithSkeleton
              src={streamer.avatarImage}
              alt={streamer.username}
              className="h-10 w-10 shrink-0 rounded-full bg-surface-2 object-cover"
            />
            <span className="min-w-0">
              <span className="block truncate font-logo text-sm font-semibold text-text">
                {streamer.username}
              </span>
              <span className="block truncate text-xs text-text-dim">
                {streamer.followerCount.toLocaleString()} followers
              </span>
            </span>
          </Link>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <VideoLikeButton videoId={video.id} likeCount={video.likeCount} />

          {/* فاز ۱۰ این کامپوننت رو ساخت ولی صفحه‌ی تماشا هیچ‌وقت ازش استفاده نکرده بود -
              در حالی که لینک یه ویدیو دقیقاً همون چیزیه که آدم می‌خواد بفرسته */}
          <ShareMenu shareUrl={`${window.location.origin}/watch/${video.id}`} />

          {streamer && !isOwnChannel && (
            <button
              type="button"
              onClick={handleFollowClick}
              className={
                isFollowingChannel
                  ? 'rounded-full border border-border px-5 py-2 text-sm font-semibold text-text transition-all hover:bg-surface-2 active:scale-95'
                  : 'rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-accent/25 transition-all hover:scale-[1.03] active:scale-95'
              }
            >
              {isFollowingChannel ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* کلیپ فقط رو ویدیوهایی که واقعاً فایل دارن معنی داره - نمی‌شه یه لحظه از یه
          ویدیویی که اصلاً پخش نمی‌شه رو بوکمارک کرد */}
      {video.videoUrl && (
        // کلیپ‌ها هم تو کارت خودشون - وگرنه رو زمینه‌ی لخت، معلوم نبود کجا تموم شدن و
        // به بخش بعدی چسبیده بودن
        <div className="rounded-2xl border border-border bg-surface px-4 py-3.5">
          <VideoClips
            videoId={video.id}
            channelOwnerId={streamer?.userId}
            getCurrentTime={getCurrentTime}
            onJumpTo={handleJumpTo}
          />
        </div>
      )}
    </div>
  )
}

export default WatchPage
