import { createContext, useContext, useState, useEffect } from 'react'

// یه سیستم پیام کوچیک و مشترک برای کل سایت - به‌جای اینکه هر فرم خودش یه متن
// «Saved» کنار دکمه‌ش نشون بده، همه از همین‌جا یه پیام بالای صفحه نشون می‌دن
const ToastContext = createContext(null)

// چقدر پیام بمونه و چقدر طول بکشه محو شدنش (باید با duration-300 تو کلاس‌ها هماهنگ باشه)
const VISIBLE_MS = 2600
const FADE_MS = 300

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  // چرا سه‌تا تایمر: اول عنصر با حالت «محو» رندر می‌شه، بعد (یه لحظه بعد) کلاس نمایان
  // بهش می‌دیم تا مرورگر فرصت کنه ترنزیشن رو ببینه - وگرنه یهویی ظاهر می‌شه و انیمیشن
  // اصلاً دیده نمی‌شه. تایمر سوم هم بعد از تموم شدن محو شدن، عنصر رو کلاً از صفحه برمی‌داره
  useEffect(() => {
    if (!toast) return

    const showTimer = setTimeout(() => setIsVisible(true), 20)
    const hideTimer = setTimeout(() => setIsVisible(false), VISIBLE_MS)
    const removeTimer = setTimeout(() => setToast(null), VISIBLE_MS + FADE_MS)

    // اگه وسط کار یه پیام جدید بیاد، این تایمرهای قبلی باید پاک بشن وگرنه
    // پیام جدید رو زودتر از موعد محو می‌کنن
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [toast])

  // type: 'success' یا 'error'
  function showToast(message, type = 'success') {
    setIsVisible(false)
    // id برای اینه که اگه دوبار پشت‌سرهم دقیقاً یه پیام نشون داده بشه، آبجکت جدید باشه
    // و افکت بالا دوباره اجرا بشه (وگرنه ری‌اکت فکر می‌کنه هیچی عوض نشده)
    setToast({ id: Date.now(), message, type })
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <ToastMessage message={toast.message} type={toast.type} isVisible={isVisible} />
      )}
    </ToastContext.Provider>
  )
}

function ToastMessage({ message, type, isVisible }) {
  const isSuccess = type === 'success'

  return (
    // top-20 یعنی درست زیر navbar می‌شینه (navbar ارتفاعش h-14 هست و sticky)
    // pointer-events-none تا اگه دقیقاً روی چیزی افتاد، جلوی کلیک کاربر رو نگیره
    <div
      className={
        isVisible
          ? 'pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2 translate-y-0 opacity-100 transition-all duration-300 ease-out'
          : 'pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2 -translate-y-3 opacity-0 transition-all duration-300 ease-out'
      }
    >
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-2.5 shadow-lg">
        {isSuccess ? (
          <svg
            className="h-4 w-4 shrink-0 text-online"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg
            className="h-4 w-4 shrink-0 text-text-dim"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
        )}
        <span className="text-sm font-medium text-text">{message}</span>
      </div>
    </div>
  )
}

function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast باید داخل ToastProvider استفاده بشه')
  }
  return context
}

export { ToastProvider, useToast }
