// فاز ۴: چند دقیقه/ساعته لایوعه - از روی liveSince محاسبه می‌شه (یه عدد ثابت جایی
// ذخیره نمی‌شه، عین uploadedDaysAgo برای ویدیوها، هر بار از رو زمان الان حساب می‌شه)
function formatLiveDuration(liveSince) {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(liveSince).getTime()) / (60 * 1000)),
  )
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m`
  }
  const hours = Math.floor(elapsedMinutes / 60)
  const minutes = elapsedMinutes % 60
  return `${hours}h ${minutes}m`
}

// هدر استودیو: آواتار با گوش گربه، اسم کانال، هندل و وضعیت لایو بودن.
// گوش‌ها با border-triangle ساخته شدن (نه عکس) تا با رنگ تم عوض بشن
function StudioHeader({ user, streamer, followingCount, onEditClick }) {
  // فاز ۴: قبلاً این متن همیشه ثابت "not live right now" بود چون Streamer به User وصل
  // نبود و اصلاً معلوم نبود این کاربر کانال داره یا نه، چه برسه به وضعیت لایوش
  const statusText = !streamer
    ? 'no channel yet'
    : streamer.isLive
      ? `live · started ${formatLiveDuration(streamer.liveSince)} ago`
      : 'not live right now'

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        {/* دو تا مثلث = گوش گربه. از توکن‌های اکسنت استفاده می‌کنن پس تو حالت روز
            هم خودشون با پالت نارنجی هماهنگ می‌شن */}
        <span className="absolute -top-2 left-3 h-0 w-0 -rotate-[20deg] border-x-[10px] border-b-[17px] border-x-transparent border-b-accent" />
        <span className="absolute -top-2 right-3 h-0 w-0 rotate-[20deg] border-x-[10px] border-b-[17px] border-x-transparent border-b-accent-2" />
        <img
          src={user.avatarImage}
          alt={user.username}
          className="relative h-20 w-20 rounded-full border-4 border-bg bg-surface-2 object-cover"
        />
        {/* نقطه‌ی سبز فقط وقتی واقعاً لایوعه نشون داده می‌شه - همون رنگ بج LIVE تو بقیه‌ی سایت */}
        {streamer?.isLive && (
          <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-bg bg-online" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="font-logo text-2xl font-semibold text-text">Your channel</h1>
        <p className="mt-1 truncate text-sm text-text-dim">
          @{user.username} · {followingCount} following · {statusText}
        </p>
      </div>

      <button
        type="button"
        onClick={onEditClick}
        className="shrink-0 self-start rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-text-dim transition-colors hover:text-text sm:self-auto"
      >
        Edit channel
      </button>
    </div>
  )
}

export default StudioHeader
