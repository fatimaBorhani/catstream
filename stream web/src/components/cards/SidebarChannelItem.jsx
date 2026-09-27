import { Link } from 'react-router-dom'
import ImageWithSkeleton from '../common/ImageWithSkeleton'

function SidebarChannelItem({ avatarImage, username, categoryName, viewerCount, isLive }) {
  return (
    // Link مثل تگ <a> ظاهر می‌شه ولی صفحه رو کامل رفرش نمی‌کنه،
    // فقط Outlet داخل Layout رو با صفحه‌ی جدید عوض می‌کنه
    <Link
      to={`/channel/${username}`}
      className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-2 active:bg-surface-2/70"
    >
      <span className="relative shrink-0">
        {/* bg-surface-2 پشت آواتار: بعضی آواتارها (گربه‌های پیش‌فرض) پس‌زمینه‌ی شفاف دارن،
            بدون این تو حالت روز روی زمینه‌ی روشن تقریباً محو می‌شن.
            آفلاین‌ها هم عمداً بی‌رنگ و کم‌رنگ‌ترن تا از دور فرقشون با لایوها معلوم باشه */}
        <ImageWithSkeleton
          src={avatarImage}
          alt={username}
          className={
            isLive
              ? 'h-8 w-8 rounded-full bg-surface-2 object-cover'
              : 'h-8 w-8 rounded-full bg-surface-2 object-cover opacity-50 grayscale'
          }
        />
        {/* نقطه‌ی سبز گوشه‌ی آواتار فقط برای کسیه که الان لایوه */}
        {isLive && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-online" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={
            isLive
              ? 'block truncate text-sm font-medium text-text'
              : 'block truncate text-sm font-medium text-text-dim'
          }
        >
          {username}
        </span>
        <span className="block truncate text-xs text-text-dim">{categoryName}</span>
      </span>

      {/* لایو: تعداد بیننده. آفلاین: خود کلمه‌ی Offline - چون عدد بیننده برای یه کانال
          خاموش معنی نداره و گمراه‌کننده‌ست */}
      {isLive ? (
        <span className="shrink-0 text-xs font-medium text-text-dim">
          {viewerCount.toLocaleString()}
        </span>
      ) : (
        <span className="shrink-0 text-xs text-text-dim">Offline</span>
      )}
    </Link>
  )
}

export default SidebarChannelItem
