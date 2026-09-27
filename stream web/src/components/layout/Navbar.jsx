import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import ImageWithSkeleton from '../common/ImageWithSkeleton'
import NotificationsMenu from './NotificationsMenu'

// حداکثر چندتا نتیجه از هر بخش (چنل/کتگوری) تو دراپ‌داون جستجو نشون بدیم
const MAX_RESULTS_PER_SECTION = 4

// اسکریپت داخل index.html همون اول data-theme رو روی <html> می‌ذاره تا پرش تم نداشته باشیم؛
// اینجا فقط همون مقدار رو می‌خونیم تا وضعیت اولیه‌ی useState درست باشه
function getInitialTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function Navbar({ onMenuClick }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  // خروج دیگه یهویی نیست: اول یه پنجره‌ی تأیید باز می‌شه
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, logout, openAuthModal } = useAuth()
  const { streamers, categories, videos } = useData()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const isSearchOpen = trimmedQuery.length > 0

  // جستجو رو کاملاً لوکال رو دیتایی که از سرور گرفتیم انجام می‌دیم - نه یه درخواست جدا به بک‌اند،
  // چون تعداد استریمر/کتگوری کمه و همه‌شون از قبل تو DataContext موجودن
  const matchedStreamers = isSearchOpen
    ? streamers
        .filter((streamer) => streamer.username.toLowerCase().includes(trimmedQuery))
        .slice(0, MAX_RESULTS_PER_SECTION)
    : []
  const matchedCategories = isSearchOpen
    ? categories
        .filter((category) => category.name.toLowerCase().includes(trimmedQuery))
        .slice(0, MAX_RESULTS_PER_SECTION)
    : []
  // فاز ۱۸: ویدیوها هم به نتایج اضافه شدن. تا قبل از این، سرچ فقط کانال و دسته‌بندی رو
  // می‌دید - یعنی کاربری که اسم یه ویدیو رو می‌دونست هیچ راهی برای رسیدن بهش نداشت
  const matchedVideos = isSearchOpen
    ? videos
        .filter((video) => video.title.toLowerCase().includes(trimmedQuery))
        .slice(0, MAX_RESULTS_PER_SECTION)
    : []
  const hasNoResults =
    isSearchOpen &&
    matchedStreamers.length === 0 &&
    matchedCategories.length === 0 &&
    matchedVideos.length === 0

  function handleSelectStreamer(username) {
    navigate(`/channel/${username}`)
    setSearchQuery('')
  }

  function handleSelectCategory(categoryId) {
    navigate(`/category/${categoryId}`)
    setSearchQuery('')
  }

  function handleSelectVideo(videoId) {
    navigate(`/watch/${videoId}`)
    setSearchQuery('')
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Escape') {
      setSearchQuery('')
      event.currentTarget.blur()
    }
  }

  // هر بار theme عوض بشه، هم روی <html> اعمالش می‌کنیم (تا CSS variableها آپدیت بشن)
  // هم تو localStorage ذخیره می‌کنیم تا دفعه‌ی بعد که صفحه رو باز می‌کنی همون انتخاب بمونه
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'))
  }

  // کلیک روی Log Out فقط منو رو می‌بنده و پنجره‌ی تأیید رو باز می‌کنه - خروج واقعی
  // بعد از تأیید کاربر اتفاق می‌افته
  function handleLogoutClick() {
    setIsProfileMenuOpen(false)
    setIsLogoutConfirmOpen(true)
  }

  function confirmLogout() {
    logout()
    setIsLogoutConfirmOpen(false)
    showToast('You have been signed out')
    // بعد از خروج، اگه تو یه صفحه‌ی نیازمند لاگین باشی (پروفایل/داشبورد) اونجا موندن
    // بی‌معنیه، پس برمی‌گردیم به صفحه‌ی اصلی
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-surface px-3 sm:gap-4 sm:px-4">
      {/* دکمه‌ی منو - سایدبار رو باز/بسته می‌کنه. state خودش تو Layout نگه داشته می‌شه
          چون هم این دکمه هم خود Sidebar بهش نیاز دارن */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Toggle menu"
        className="shrink-0 rounded-full p-2 text-text-dim transition-all hover:bg-surface-2 hover:text-text active:scale-90"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/* لوگو: گیف گربه‌ی پیکسلی + اسم سایت با فونت Fredoka (فقط همین‌جا و مودال لاگین
          از این فونت استفاده می‌کنن). image-rendering: pixelated نمی‌ذاره مرورگر
          گیف پیکسل‌آرت رو محو کنه.
          متن "catstream" بین sm و md مخفی می‌شه - دقیقاً همون بازه‌ای که باکس سرچ
          (hidden sm:block) و Browse ظاهر می‌شن و جا کم میاد؛ بدون این متن، خودِ آیکون
          گربه (که همیشه دیده می‌شه) به‌جای اینکه باکس سرچ رو به دیوار بچسبونه، جا باز می‌کنه */}
      <Link to="/" className="flex shrink-0 items-center gap-2">
        <img src="/logo.gif" alt="" className="h-8 w-8 pt-1 [image-rendering:pixelated]" />
        <span className="hidden font-logo text-2xl font-semibold leading-none text-text md:inline-block">
          catstream
        </span>
      </Link>

      {/* باکس جستجو - رو دیتای واقعی (اسم استریمر / اسم کتگوری) لوکال فیلتر می‌کنه و
          یه دراپ‌داون نتیجه نشون می‌ده. تو موبایل کلاً مخفیه (جای کافی نیست)، حالت پیش‌فرض
          یه border-2 شفافه (رنگش دیده نمی‌شه ولی جاش رزرو شده) تا وقتی روی فوکوس رنگیش
          می‌کنیم، اندازه‌ی باکس عوض نشه و پرش نداشته باشه.
          min-width داره تا وقتی پنجره باریک می‌شه، باکس سرچ بی‌نهایت جمع نشه و به یه
          مربع کوچیکِ غیرقابل‌استفاده تبدیل نشه؛ فشار کم‌شدنِ جا رو به‌جاش Browse
          (که پایین‌تر تو حالت باریک فقط آیکون می‌شه) جذب می‌کنه */}
      <div className="relative ml-2 hidden w-full min-w-[12rem] max-w-sm sm:block md:ml-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search"
          className="w-full rounded-md border-2 border-transparent bg-surface-2 px-3 py-1.5 text-sm text-text placeholder:text-text-dim transition-all duration-300 hover:brightness-125 focus:border-accent focus:outline-none"
        />

        {isSearchOpen && (
          <>
            {/* لایه‌ی نامرئی پشت دراپ‌داون - کلیک بیرون دراپ‌داون می‌بندتش */}
            <button
              type="button"
              aria-label="Close search results"
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setSearchQuery('')}
            />
            <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-md border border-border bg-surface p-2 shadow-lg">
              {hasNoResults && (
                <p className="px-2 py-2 text-sm text-text-dim">
                  No results for "{searchQuery.trim()}"
                </p>
              )}

              {matchedStreamers.length > 0 && (
                <div className="mb-1">
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-dim">
                    Channels
                  </p>
                  {matchedStreamers.map((streamer) => (
                    <button
                      key={streamer.id}
                      type="button"
                      onClick={() => handleSelectStreamer(streamer.username)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-shadow duration-200 ease-out hover:shadow-[inset_0_0_16px_2px_var(--shadow-inset-tint)]"
                    >
                      <span className="relative shrink-0">
                        <ImageWithSkeleton
                          src={streamer.avatarImage}
                          alt={streamer.username}
                          className="h-8 w-8 rounded-full bg-surface-2 object-cover"
                        />
                        {streamer.isLive && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-online" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-text">
                          {streamer.username}
                        </span>
                        <span className="block truncate text-xs text-text-dim">
                          {streamer.isLive ? 'Live now' : 'Offline'}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchedCategories.length > 0 && (
                <div>
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-dim">
                    Categories
                  </p>
                  {matchedCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleSelectCategory(category.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-shadow duration-200 ease-out hover:shadow-[inset_0_0_16px_2px_var(--shadow-inset-tint)]"
                    >
                      <ImageWithSkeleton
                        src={category.boxArtImage}
                        alt={category.name}
                        className="h-10 w-8 shrink-0 rounded object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-text">
                          {category.name}
                        </span>
                        <span className="block truncate text-xs text-text-dim">
                          {category.viewerCount.toLocaleString()} viewers
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchedVideos.length > 0 && (
                <div className="mt-1">
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-dim">
                    Videos
                  </p>
                  {matchedVideos.map((video) => (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => handleSelectVideo(video.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-shadow duration-200 ease-out hover:shadow-[inset_0_0_16px_2px_var(--shadow-inset-tint)]"
                    >
                      <ImageWithSkeleton
                        src={video.thumbnailImage}
                        alt={video.title}
                        className="h-8 w-14 shrink-0 rounded bg-surface-2 object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-text">
                          {video.title}
                        </span>
                        <span className="block truncate text-xs text-text-dim">
                          {video.streamerUsername}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Browse بعد از باکس سرچ می‌شینه نه قبلش. یه پیل با آیکون قطب‌نما شد نه متن لخت -
          کنار باکس سرچ، متن تنها شبیه یه چیز جاافتاده به نظر می‌رسید.
          تو پنجره‌ی باریک (زیر md) فقط آیکون قطب‌نما به‌شکل یه دایره می‌مونه و متن
          Browse مخفی می‌شه - همون جای آزادشده می‌ره به باکس سرچ */}
      <Link
        to="/browse"
        aria-label="Browse"
        title="Browse"
        className="hidden h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-surface-2 font-logo text-sm font-medium text-text-dim transition-colors hover:text-text sm:flex md:h-auto md:w-auto md:px-3.5 md:py-1.5"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="m15.2 8.8-2 4.4-4.4 2 2-4.4 4.4-2z" />
        </svg>
        <span className="hidden md:inline">Browse</span>
      </Link>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {/* دکمه‌ی تعویض حالت روز/شب. آیکون خورشید یعنی الان شبه (بزن بشه روز)،
            آیکون ماه یعنی الان روزه (بزن بشه شب) — یعنی آیکون همیشه حالتی که میری توشو نشون می‌ده */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle light/dark mode"
          className="rounded-full p-2 text-text-dim transition-all hover:bg-surface-2 hover:text-text active:scale-90"
        >
          {theme === 'dark' ? (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
            </svg>
          )}
        </button>

        {/* زنگوله و لیستش - خودش state باز/بسته بودنش رو داره */}
        <NotificationsMenu />

        {user ? (
          // لاگین کرده: دکمه‌های Log In/Sign Up دیگه معنی ندارن، به‌جاش آواتار خودش
          // با یه منوی کوچیک (شامل Log Out) نشون داده می‌شه
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2 transition-all hover:bg-surface-2 active:scale-95 sm:pr-3"
            >
              <img
                src={user.avatarImage}
                alt={user.username}
                className="h-7 w-7 rounded-full bg-surface-2 object-cover"
              />
              <span className="hidden max-w-[8rem] truncate text-sm font-medium text-text sm:inline-block">
                {user.username}
              </span>
            </button>

            {isProfileMenuOpen && (
              <>
                {/* یه لایه‌ی نامرئی پشت منو که با کلیک روش (بیرون منو) بسته‌ش می‌کنه */}
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
                  {/* بالای منو خود کاربر رو نشون می‌دیم تا معلوم باشه با کدوم اکانت واردی -
                      قبلاً فقط تو موبایل یه اسم خشک بود */}
                  <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2">
                    <img
                      src={user.avatarImage}
                      alt={user.username}
                      className="h-9 w-9 shrink-0 rounded-full bg-surface-2 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-logo text-sm font-semibold text-text">
                        {user.username}
                      </p>
                      <p className="truncate text-xs text-text-dim">@{user.username}</p>
                    </div>
                  </div>

                  <div className="my-1 h-px bg-border" />

                  {/* فاز ۸: صفحه‌ی جدید Following - قبلاً فقط تو سایدبار قابل دیدن بود */}
                  <Link
                    to="/following"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-text transition-colors hover:bg-surface-2"
                  >
                    <svg
                      className="h-4 w-4 shrink-0 text-text-dim"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    Following
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-text transition-colors hover:bg-surface-2"
                  >
                    <svg
                      className="h-4 w-4 shrink-0 text-text-dim"
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
                    Profile
                  </Link>

                  <Link
                    to="/dashboard"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-text transition-colors hover:bg-surface-2"
                  >
                    <svg
                      className="h-4 w-4 shrink-0 text-text-dim"
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
                    Dashboard
                  </Link>

                  <div className="my-1 h-px bg-border" />

                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="m16 17 5-5-5-5M21 12H9" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* تو موبایل فقط Sign Up (که مهم‌تره) می‌مونه، Log In مخفی می‌شه تا جا کم نیاد.
                همه‌ی این دکمه‌ها به‌جای رفتن به یه صفحه‌ی دیگه، مودال لاگین/ساین‌آپ رو باز می‌کنن */}
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="hidden shrink-0 rounded-md border border-border px-4 py-1.5 text-sm font-medium text-text transition-all hover:bg-surface-2 active:scale-95 sm:inline-block"
            >
              Log In
            </button>

            {/* دکمه‌ی اصلی با یه گرادیانت ملایم از accent به یه سایه‌ی تیره‌تر از همون رنگ (accent-2)،
                به‌جای یه رنگ تخت، یه‌کم عمق و برجستگی بهش می‌ده. چون از توکن accent-2 استفاده کردیم
                (نه یه رنگ هاردکد)، تو حالت روز هم خودش با پالت نارنجی هماهنگ می‌مونه */}
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="shrink-0 rounded-md bg-gradient-to-r from-accent to-accent-2 px-2.5 py-1.5 text-sm font-medium text-white shadow-md shadow-accent/20 transition-transform duration-200 hover:scale-[1.03] active:scale-95 sm:px-4"
            >
              Sign Up
            </button>

            {/* آیکون پروفایل عمومی؛ چون هنوز لاگین نکردیم، کلیکش مودال لاگین رو باز می‌کنه
                (مخصوصاً تو موبایل که دکمه‌ی متنی Log In مخفیه، این تنها راه دسترسیه) */}
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              aria-label="Log in"
              className="rounded-full border border-border p-1.5 text-text-dim transition-all hover:bg-surface-2 hover:text-text active:scale-90"
            >
              <svg
                className="h-5 w-5"
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
            </button>
          </>
        )}
      </div>

      {/* پنجره‌ی تأیید خروج - همون شکل بک‌دراپ و کارتی که AuthModal داره تا غریبه نباشه */}
      {isLogoutConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsLogoutConfirmOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl"
          >
            <h2 className="font-brand text-lg font-bold text-text">Log out?</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-dim">
              You'll need to log in again to see your profile and dashboard.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text transition-all hover:bg-surface-2 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-md bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.03] active:scale-95"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
