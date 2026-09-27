import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ImageWithSkeleton from '../common/ImageWithSkeleton'

const API_BASE = 'http://localhost:4000/api'

// فاز ۲۲: قبلاً این لیست تو خود فرانت از روی DataContext ساخته می‌شد و هیچ مفهومی از
// «دیده شده» نداشت - برای همین عدد روی زنگوله هیچ‌وقت صفر نمی‌شد و کامنت‌ها هم اصلاً
// توش نبودن. حالا سرور هر سه منبع (کامنت زیر کانالت، ویدیوی تازه‌ی کانال‌های فالوشده،
// و لایو بودنشون) رو با هم می‌ده و خودش می‌گه کدوم خونده‌نشده‌ست
function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  const loadNotifications = useCallback(async () => {
    // مهمون نوتیفیکیشن نداره - نه کانالی داره که کامنت بگیره، نه فالویی
    if (!user) {
      setItems([])
      setUnreadCount(0)
      return
    }
    try {
      const response = await fetch(`${API_BASE}/notifications`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // شبکه قطع بود - لیست قبلی می‌مونه، دفعه‌ی بعد که منو باز بشه دوباره تلاش می‌کنیم
    }
  }, [user])

  // یه بار موقع بالا اومدن (و هر بار که کاربر عوض می‌شه) تا بج بدون باز کردن منو هم درست باشه
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  async function handleToggle() {
    // بستن منو هیچ کاری لازم نداره
    if (isOpen) {
      setIsOpen(false)
      return
    }

    setIsOpen(true)
    await loadNotifications()

    if (!user) return

    // بج بلافاصله صفر می‌شه ولی نقطه‌های کنار آیتم‌ها تو همین باز کردن سر جاشون می‌مونن،
    // تا کاربر ببینه کدوم‌ها تازه بودن. دفعه‌ی بعد که باز کنه، خونده حساب می‌شن
    setUnreadCount(0)
    try {
      await fetch(`${API_BASE}/notifications/seen`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // اگه نرسید، دفعه‌ی بعد دوباره ناخونده نشون داده می‌شن - که از قِلِم افتادنشون بهتره
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-text-dim transition-all hover:bg-surface-2 hover:text-text active:scale-90"
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
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* بج فقط خونده‌نشده‌ها رو می‌شمره - نه کل لیست. یعنی وقتی چیز تازه‌ای نیست،
            اصلاً بجی وجود نداره */}
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* لایه‌ی نامرئی پشت منو - کلیک بیرون منو می‌بندتش */}
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
            <p className="px-2.5 py-2 font-logo text-sm font-semibold text-text">
              Notifications
            </p>

            {items.length === 0 ? (
              <p className="px-2.5 pb-3 pt-1 text-xs leading-relaxed text-text-dim">
                {user
                  ? 'Nothing new. Follow a few channels and you will hear when they go live or post.'
                  : 'Log in and follow channels to get notified when they go live.'}
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.link}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-surface-2"
                  >
                    <span className="relative shrink-0">
                      <ImageWithSkeleton
                        src={item.avatarImage}
                        alt=""
                        className="h-9 w-9 rounded-full bg-surface-2 object-cover"
                      />
                      {item.type === 'live' && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-online" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-text-dim">
                        {item.detail}
                      </span>
                    </span>

                    {/* نقطه‌ی تازگی - تنها نشونه‌ی بصریِ «این رو هنوز ندیده بودی» */}
                    {item.isUnread && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationsMenu
