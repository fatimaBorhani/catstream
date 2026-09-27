import ImageWithSkeleton from '../common/ImageWithSkeleton'
import ShareMenu from '../common/ShareMenu'

// هدر کانال: کاور + آواتار با گوش گربه + اسم و هندل + دکمه‌ی فالو.
// شبیه یوتیوب/توییچ، ولی گوش‌ها و رنگ‌هاش از تم خود catstream میان
// فاز ۱۹: viewerCount جدا از streamer پاس داده می‌شه (نه streamer.viewerCount) چون وقتی
// کانال لایوعه، عدد واقعی از سوکت میاد نه از رکورد دیتابیس - و این کامپوننت نباید بدونه
// اون عدد از کجا اومده
function ChannelHeader({
  streamer,
  viewerCount,
  categoryName,
  isFollowing,
  isOwnChannel,
  onFollowClick,
  onAvatarClick,
}) {
  // نکته: روی کارت بیرونی overflow-hidden نداریم. منوی سه‌نقطه (Copy channel link)
  // پایین‌تر از لبه‌ی کارت باز می‌شه و با overflow-hidden بریده می‌شد. به‌جاش گرد کردن
  // گوشه‌ها رو کاور (بالا) و ردیف اطلاعات (پایین) هرکدوم خودشون انجام می‌دن
  return (
    <div className="rounded-2xl border border-border">
      {/* کاور - گرادیانت با هاله‌های رنگی. رنگ‌ها از توکن‌های تم میان پس تو حالت روز
          هم خودشون عوض می‌شن */}
      <div className="relative h-28 overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#151a2b] to-[#0e1017] sm:h-36">
        <div className="pointer-events-none absolute -left-10 -top-12 h-44 w-44 rounded-full bg-accent/40 blur-3xl" />
        <div className="pointer-events-none absolute right-24 -top-6 h-36 w-36 rounded-full bg-cat-pink/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-8 top-6 h-36 w-36 rounded-full bg-cat-violet/30 blur-3xl" />
      </div>

      <div className="flex flex-col gap-4 rounded-b-2xl bg-surface px-5 pb-5 pt-4 sm:flex-row sm:items-end sm:px-6 sm:pb-6">
        <div className="relative z-10 flex items-end gap-4">
          {/* فقط آواتار با margin منفی میره روی کاور، نه کل ردیف: قبلاً اسم کانال هم
              می‌رفت روی کاور و چون تو حالت روز رنگ متن تیره‌ست، رو کاور تیره تقریباً
              نامرئی می‌شد. با items-end، این margin منفی فقط آواتار رو بالا می‌بره و
              متن سر جاش رو پس‌زمینه‌ی روشن می‌مونه.
              کلیک روی آواتار هم می‌بره به تب About - یعنی «پروفایلشو نشونم بده» */}
          <button
            type="button"
            onClick={onAvatarClick}
            aria-label={`About ${streamer.username}`}
            className="relative -mt-16 shrink-0 sm:-mt-20"
          >
            <span className="absolute -top-2 left-3 h-0 w-0 -rotate-[20deg] border-x-[11px] border-b-[18px] border-x-transparent border-b-accent" />
            <span className="absolute -top-2 right-3 h-0 w-0 rotate-[20deg] border-x-[11px] border-b-[18px] border-x-transparent border-b-accent-2" />
            <ImageWithSkeleton
              src={streamer.avatarImage}
              alt={streamer.username}
              className="relative h-24 w-24 rounded-full border-4 border-surface bg-surface-2 object-cover"
            />
            {streamer.isLive && (
              <span className="absolute bottom-1 right-0 rounded-full border-[3px] border-surface bg-online px-2 py-0.5 text-[10px] font-bold text-bg">
                LIVE
              </span>
            )}
          </button>

          <div className="min-w-0 pb-1">
            <h1 className="font-logo text-2xl font-semibold text-text">
              {streamer.username}
            </h1>
            <p className="mt-0.5 truncate text-sm text-text-dim">
              @{streamer.username.toLowerCase()} · {categoryName}
            </p>
            <p className="truncate text-sm text-text-dim">
              {streamer.isLive
                ? `${viewerCount.toLocaleString()} watching now`
                : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto sm:pb-2">
          {/* رو کانال خودت دکمه‌ی فالو نشون داده نمی‌شه - فالو کردن خودت بی‌معنیه و
              عدد فالوور رو الکی بالا می‌بره. دکمه‌ی اشتراک‌گذاری ولی می‌مونه، چون آدم
              لینک کانال خودشو حتماً می‌خواد بفرسته */}
          {!isOwnChannel && (
          <button
            type="button"
            onClick={onFollowClick}
            className={
              isFollowing
                ? 'flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold text-text transition-all hover:bg-surface-2 active:scale-95'
                : 'flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-cat-violet px-5 py-2 text-sm font-semibold text-white shadow-md shadow-accent/25 transition-all hover:scale-[1.03] active:scale-95'
            }
          >
            {/* آیکون پنجه به‌جای قلب - امضای بصری خود سایته */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <ellipse cx="6.5" cy="9.5" rx="2.2" ry="2.8" />
              <ellipse cx="12" cy="7.4" rx="2.3" ry="2.9" />
              <ellipse cx="17.5" cy="9.5" rx="2.2" ry="2.8" />
              <path d="M12 12.4c3.2 0 5.6 2.3 5.6 4.7 0 2-1.7 3.4-3.9 3.4-1 0-1.2.3-1.7.3s-.7-.3-1.7-.3c-2.2 0-3.9-1.4-3.9-3.4 0-2.4 2.4-4.7 5.6-4.7z" />
            </svg>
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          )}

          {/* فاز ۱۰: منوی سه‌نقطه برای اشتراک‌گذاری - لینک از window.location.origin ساخته
              می‌شه، نه هاردکد، تا رو هر آدرسی (لوکال یا بعداً دیپلوی‌شده) درست کار کنه */}
          <ShareMenu shareUrl={`${window.location.origin}/channel/${streamer.username}`} />
        </div>
      </div>
    </div>
  )
}

export default ChannelHeader
