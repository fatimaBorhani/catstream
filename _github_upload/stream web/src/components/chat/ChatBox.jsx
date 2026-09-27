import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

// همون آدرس بک‌اند، بدون /api - چون سوکت به ریشه‌ی سرور وصل می‌شه نه به روت‌های REST
const SOCKET_URL = 'http://localhost:4000'

// پیام‌های دیتابیس رنگ ذخیره‌شده ندارن (برخلاف دیتای mock قبلی که رنگش دستی نوشته شده
// بود). به‌جای رنگ رندوم - که با هر رندر عوض می‌شد و چت رو چشمک‌زن می‌کرد - رنگ هر اسم
// از خودِ همون اسم ساخته می‌شه، پس یه کاربر همیشه و همه‌جا یه رنگ داره
const USERNAME_COLORS = [
  '#f472b6',
  '#60a5fa',
  '#34d399',
  '#fbbf24',
  '#a78bfa',
  '#fb7185',
  '#22d3ee',
]

function colorForUsername(username) {
  let sum = 0
  for (let index = 0; index < username.length; index += 1) {
    sum += username.charCodeAt(index)
  }
  return USERNAME_COLORS[sum % USERNAME_COLORS.length]
}

// فاز ۱۳: چت واقعی. قبلاً این کامپوننت یه آرایه‌ی ثابت (src/data/chatMessages.js) رو با
// setInterval می‌چرخوند و پیام کاربر فقط تو state خودش می‌نشست - یعنی هیچ پیامی به هیچ
// آدمی نمی‌رسید. حالا با socket.io به سرور وصل می‌شه و پیام‌ها واقعاً بین بیننده‌ها پخش
// می‌شن و رو دیتابیس می‌مونن
// onViewerCountChange عیناً همون الگوی onHeightChange تو VideoPlayer ئه: سوکت اینجا زندگی
// می‌کنه ولی عددِ بیننده باید بالای صفحه (کنار عنوان و تو هدر کانال) نشون داده بشه، پس
// به‌جای اینکه سوکت رو به ChannelPage ببریم، همون عدد رو به بالا گزارش می‌دیم
function ChatBox({ streamerId, onViewerCountChange }) {
  const { user, openAuthModal } = useAuth()
  const { showToast } = useToast()

  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  // خودِ سوکت تو ref نگه داشته می‌شه نه state، چون عوض شدنش نباید باعث رندر دوباره بشه
  const socketRef = useRef(null)
  const listRef = useRef(null)

  // showToast تو هر رندرِ ToastProvider از نو ساخته می‌شه، پس اگه مستقیم تو وابستگی‌های
  // افکت پایین می‌ذاشتیمش، با هر توستی که هر جای سایت نشون داده می‌شد، سوکت قطع و دوباره
  // وصل می‌شد. برای همین آخرین نسخه‌ش رو تو یه ref نگه می‌داریم و افکت فقط به streamerId
  // وابسته می‌مونه
  const showToastRef = useRef(showToast)
  showToastRef.current = showToast

  // به همون دلیل showToast: این پراپ از بیرون میاد و اگه تو وابستگی‌های افکت بود، هر
  // رندرِ ChannelPage می‌تونست سوکت رو قطع و وصل کنه
  const onViewerCountChangeRef = useRef(onViewerCountChange)
  onViewerCountChangeRef.current = onViewerCountChange

  useEffect(() => {
    // withCredentials یعنی کوکی httpOnly لاگین همراه handshake فرستاده بشه - بدون این،
    // سرور هر کسی رو مهمون می‌دید و اجازه‌ی ارسال پیام نمی‌داد
    const socket = io(SOCKET_URL, { withCredentials: true })
    socketRef.current = socket

    // join بعد از connect زده می‌شه نه بلافاصله، چون سوکت تازه‌ساخته هنوز وصل نشده.
    // این هنگام اتصال مجدد خودکار (قطعی موقت شبکه، ری‌استارت سرور) دوباره اجرا می‌شه و
    // خودش کاربر رو به همون اتاق برمی‌گردونه
    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('chat:join', streamerId)
    })

    socket.on('disconnect', () => setIsConnected(false))

    // سابقه‌ی پیام‌ها موقع ورود - جایگزین کامل لیست، نه اضافه شدن به تهش (وگرنه بعد از
    // هر اتصال مجدد، همون پیام‌ها دوباره تکرار می‌شدن)
    socket.on('chat:history', (history) => setMessages(history))

    socket.on('chat:message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message])
    })

    socket.on('chat:error', (errorMessage) => showToastRef.current(errorMessage, 'error'))

    // فاز ۱۹: سرور هر بار که کسی وارد یا خارج این کانال می‌شه عدد تازه رو می‌فرسته
    socket.on('viewers:count', (count) => {
      if (onViewerCountChangeRef.current) {
        onViewerCountChangeRef.current(count)
      }
    })

    // بدون این، رفتن به کانال بعدی یه سوکت جدید باز می‌کرد و قبلی باز می‌موند
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [streamerId])

  // هر بار لیست پیام‌ها عوض شد، خودکار به آخرین پیام اسکرول کن
  useEffect(() => {
    const listElement = listRef.current
    if (listElement) {
      listElement.scrollTop = listElement.scrollHeight
    }
  }, [messages])

  function handleSend(text) {
    // پیام رو محلی به لیست اضافه نمی‌کنیم؛ سرور همون پیام رو به همه‌ی اتاق (از جمله خود
    // فرستنده) برمی‌گردونه. اینجوری چیزی که خودت می‌بینی دقیقاً همونیه که بقیه می‌بینن
    if (!socketRef.current) return
    socketRef.current.emit('chat:send', { content: text })
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-brand text-sm font-bold text-text">Stream Chat</h2>
        {/* وقتی اتصال قطعه، سکوت چت باید توضیح داشته باشه - وگرنه کاربر فکر می‌کنه
            پیامش رفته ولی کسی جواب نمی‌ده */}
        {!isConnected && <span className="text-xs text-text-dim">Reconnecting...</span>}
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2"
      >
        {messages.length === 0 ? (
          <p className="px-1 py-2 text-xs text-text-dim">
            No messages yet. Say something.
          </p>
        ) : (
          messages.map((chatMessage) => (
            <ChatMessage
              key={chatMessage.id}
              username={chatMessage.authorUsername}
              color={colorForUsername(chatMessage.authorUsername)}
              message={chatMessage.content}
            />
          ))
        )}
      </div>

      {user ? (
        <ChatInput onSend={handleSend} />
      ) : (
        // قابلیت ارسال پیام فقط بعد از لاگین باز می‌شه؛ تا اون‌موقع یه دکمه به‌جای اینپوت
        // نشون می‌دیم که مودال لاگین رو باز می‌کنه (نه رفتن به یه صفحه‌ی دیگه)
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="block w-full rounded-md border border-dashed border-border bg-surface-2 px-3 py-2 text-center text-sm font-medium text-text-dim transition-colors hover:border-accent hover:text-accent"
          >
            Log in to chat
          </button>
        </div>
      )}
    </div>
  )
}

export default ChatBox
