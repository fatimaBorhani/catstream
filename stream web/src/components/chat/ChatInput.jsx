import { useState } from 'react'

// باید با MAX_MESSAGE_LENGTH تو server/src/lib/chat.js یکی باشه - اینجا جلوی تایپ بیشتر
// رو می‌گیریم تا کاربر قبل از فرستادن بفهمه، ولی سرور هم مستقلاً چک می‌کنه (چون هر کسی
// می‌تونه مستقیم به سوکت پیام بفرسته، بدون این فرم)
const MAX_MESSAGE_LENGTH = 300

// فاز ۱۳: پیام دیگه لوکال نمی‌مونه - onSend اونو از راه سوکت به سرور می‌فرسته و سرور
// همون پیام رو به همه‌ی بیننده‌های این کانال (از جمله خود فرستنده) پخش می‌کنه
function ChatInput({ onSend }) {
  const [text, setText] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t border-border p-3"
    >
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder="Send a message"
        className="w-full rounded-md border-2 border-transparent bg-surface-2 px-3 py-1.5 text-sm text-text placeholder:text-text-dim transition-all duration-300 hover:brightness-125 focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="rounded-md bg-gradient-to-r from-accent to-accent-2 px-3 py-1.5 text-sm font-medium text-white transition-all enabled:hover:brightness-110 enabled:active:scale-95 disabled:opacity-40"
      >
        Chat
      </button>
    </form>
  )
}

export default ChatInput
