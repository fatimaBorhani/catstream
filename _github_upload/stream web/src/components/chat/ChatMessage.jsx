// یه پیام چت به شکل یه باکس مجزا: اسم فرستنده ریز و رنگی بالای پیام،
// و بردر باکس هم‌رنگ همون اسمه تا هر کاربر تو چت به‌وضوح شناخته بشه.
// اگه color نداشته باشه (مثلاً پیام خود کاربر)، به‌جای رنگ هاردکد از متغیر accent استفاده می‌کنیم
// تا بین حالت روز و شب خودش هماهنگ بمونه.
function ChatMessage({ username, color, message }) {
  const senderColor = color || 'var(--color-accent)'

  return (
    <div>
      {/* اسم فرستنده بیرون و بالای باکس پیامه، نه داخلش */}
      <p className="mb-0.5 px-1 text-[11px] font-semibold" style={{ color: senderColor }}>
        {username}
      </p>
      <div
        className="rounded-2xl border bg-surface-2 px-3 py-2"
        style={{ borderColor: senderColor }}
      >
        <p className="break-words text-sm leading-snug text-text">{message}</p>
      </div>
    </div>
  )
}

export default ChatMessage
