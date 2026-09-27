// تب‌های صفحه‌ی کانال. همون شکل پیل‌های استودیو تا کل سایت یه زبان بصری داشته باشه
function LiveIcon({ className }) {
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
      <circle cx="12" cy="12" r="2" />
      <path d="M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
      <path d="M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2" />
    </svg>
  )
}

function VideoIcon({ className }) {
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
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ListIcon({ className }) {
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
      <path d="M4 7h12M4 12h12M4 17h7" />
      <path d="M19 13v6M16 16h6" />
    </svg>
  )
}

function InfoIcon({ className }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-5M12 8h.01" />
    </svg>
  )
}

// فاز ۷: آیکون کامنت‌ها - همون حباب گفتگوی ساده، هم‌خط با بقیه‌ی آیکون‌ها (stroke-width ۲)
function CommentIcon({ className }) {
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
      <path d="M4 5h16v11H8l-4 4V5z" />
    </svg>
  )
}

// تب Clips اینجا بود و برداشته شد: کلیپ یه ویژگیِ خودِ ویدیوئه، نه یه بخش مستقل کانال.
// هر کلیپی از راه ویدیوی خودش دیده می‌شه، پس یه تب جدا (که رو بیشتر کانال‌ها هم خالی
// می‌موند) فقط تکرار همون چیزی بود که یه کلیک اون‌طرف‌تر وجود داره
const CHANNEL_TABS = [
  { id: 'live', label: 'Live', icon: LiveIcon },
  { id: 'videos', label: 'Videos', icon: VideoIcon },
  { id: 'playlists', label: 'Playlists', icon: ListIcon },
  { id: 'comments', label: 'Comments', icon: CommentIcon },
  { id: 'about', label: 'About', icon: InfoIcon },
]

function ChannelTabs({ activeTab, onTabChange, videoCount, playlistCount, commentCount }) {
  // تعداد کنار لیبل نشون داده می‌شه تا کاربر قبل از کلیک بدونه اونجا چیزی هست یا نه
  const counts = { videos: videoCount, playlists: playlistCount, comments: commentCount }

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 pt-1 pl-1 pr-1">
      {CHANNEL_TABS.map((tab) => {
        const isActive = tab.id === activeTab
        const Icon = tab.icon
        const count = counts[tab.id]
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={
              isActive
                ? 'flex shrink-0 items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold text-text ring-1 ring-accent focus:outline-none focus-visible:ring-2'
                : 'flex shrink-0 items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-medium text-text-dim transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent'
            }
          >
            <Icon className={isActive ? 'h-4 w-4 text-accent' : 'h-4 w-4'} />
            <span className="whitespace-nowrap font-logo">{tab.label}</span>
            {count > 0 && (
              <span className="text-xs font-medium text-text-dim">{count}</span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

export default ChannelTabs
