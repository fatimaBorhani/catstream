import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

// همون آدرس بک‌اند که ChatBox هم استفاده می‌کنه - سوکت به ریشه‌ی سرور وصل می‌شه نه /api
const SOCKET_URL = 'http://localhost:4000'

// فاز ۲۳: قبلاً فقط ChatBox یه سوکت داشت، و اون فقط وقتی صفحه‌ی کانال تو حالت لایوعه
// mount می‌شه. یعنی کسی که یه کانالِ آفلاین رو باز نگه داشته بود، هیچ اتصالی به سرور
// نداشت و از شروع لایو شدنش بی‌خبر می‌موند تا رفرش کنه. این هوک برخلاف ChatBox، بدون
// توجه به لایو یا آفلاین بودن، همیشه یه سوکت سبک (بدون تاریخچه‌ی پیام، بدون شمارش
// بیننده) نگه می‌داره و فقط منتظر خبر شروع/پایان لایو می‌مونه
function useStreamStatus(streamerId, onStatusChange) {
  // onStatusChange از بیرون میاد (اینجا refreshData) و اگه مستقیم تو وابستگی‌های افکت
  // بود، هر رندر دوباره‌ی صفحه‌ی کانال سوکت رو قطع و وصل می‌کرد - عین همون دلیلِ رفِ
  // onViewerCountChange تو ChatBox
  const onStatusChangeRef = useRef(onStatusChange)
  onStatusChangeRef.current = onStatusChange

  useEffect(() => {
    // هنوز استریمر از سرور نرسیده (isLoading) یا صفحه‌ی «کانال پیدا نشد»ه - چیزی برای
    // ساب‌اسکرایب کردن نیست
    if (!streamerId) return

    const socket = io(SOCKET_URL, { withCredentials: true })

    socket.on('connect', () => {
      socket.emit('status:subscribe', streamerId)
    })

    // چه لایو بشه چه آفلاین، فقط کافیه دوباره از سرور بخونیم - همون تابعی که خودِ
    // استریمر هم بعد از زدن Go live/Go offline صدا می‌زنه
    socket.on('stream:status', () => {
      if (onStatusChangeRef.current) {
        onStatusChangeRef.current()
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [streamerId])
}

export default useStreamStatus
