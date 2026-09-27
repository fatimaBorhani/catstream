// آیکون‌های تب‌ها - همه خطی و ۲ پیکسل، هم‌خانواده‌ی بقیه‌ی آیکون‌های سایت (نه ایموجی)
function PencilIcon({ className }) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function ProfileIcon({ className }) {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
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

// هر تب یه id (برای state تو DashboardPage)، یه لیبل و یه کامپوننت آیکون داره
const DASHBOARD_TABS = [
  { id: 'info', label: 'Stream Info', icon: PencilIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
  { id: 'videos', label: 'Videos', icon: VideoIcon },
  { id: 'playlists', label: 'Playlists', icon: ListIcon },
]

function DashboardNav({ activeTab, onTabChange }) {
  return (
    // ردیف افقی پیل - رو موبایل قابل اسکرول می‌شه تا تب‌ها له نشن
    <nav className="flex gap-2 overflow-x-auto pb-4 pt-4 pl-2 pr-0">
      {DASHBOARD_TABS.map((tab) => {
        const isActive = tab.id === activeTab
        const Icon = tab.icon
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
          </button>
        )
      })}
    </nav>
  )
}

export default DashboardNav
