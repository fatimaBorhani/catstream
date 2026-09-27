import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// چقدر گیف لودینگ بین صفحه‌ها نشون داده بشه. چون دیتای سایت از قبل تو DataContext هست و
// جابه‌جایی بین صفحه‌ها واقعاً زمان‌بر نیست، این عدد عمداً کوتاهه - فقط یه حس انتقال می‌ده،
// نه اینکه کاربر رو معطل کنه
const LOADER_MS = 550

function RouteLoader() {
  // useLocation آدرس فعلی رو می‌ده؛ هر بار عوض بشه یعنی رفتیم یه صفحه‌ی دیگه
  const location = useLocation()
  const [loadingPath, setLoadingPath] = useState(location.pathname)
  const [isLoading, setIsLoading] = useState(true)

  // این چک عمداً موقع رندره نه داخل useEffect: اینجوری همون رندر اولِ صفحه‌ی جدید،
  // لودینگ روشنه. اگه می‌ذاشتیمش تو افکت، یه فریم صفحه‌ی جدید بدون لودینگ دیده می‌شد
  // و بعد لودینگ می‌پرید روش
  if (loadingPath !== location.pathname) {
    setLoadingPath(location.pathname)
    setIsLoading(true)
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), LOADER_MS)
    // اگه کاربر وسط لودینگ سریع رفت یه صفحه‌ی دیگه، تایمر قبلی باید پاک بشه
    // وگرنه لودینگ جدید رو زودتر از موعد می‌بنده
    return () => clearTimeout(timer)
  }, [loadingPath])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-bg/85 backdrop-blur-sm">
      {/* image-rendering: pixelated چون گیف پیکسل‌آرته - بدون این، مرورگر موقع بزرگ کردنش
          محوش می‌کنه و اون حس پیکسلی قشنگش از بین می‌ره */}
      <img
        src="/loading.gif"
        alt=""
        className="h-24 w-24 [image-rendering:pixelated]"
      />
      <span className="font-logo text-sm font-semibold tracking-wide text-text-dim">
        loading...
      </span>
    </div>
  )
}

export default RouteLoader
