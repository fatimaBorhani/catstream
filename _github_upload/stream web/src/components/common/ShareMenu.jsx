import { useState } from 'react'
import { useToast } from '../../context/ToastContext'

// دکمه‌ی سه‌نقطه با یه منوی کوچیک - همون الگوی باز/بسته‌شدنِ NotificationsMenu تو Navbar
// (لایه‌ی نامرئی پشت منو برای بسته شدن با کلیک بیرون). فعلاً فقط یه گزینه داره: کپی لینک
function ShareMenu({ shareUrl }) {
  const [isOpen, setIsOpen] = useState(false)
  const { showToast } = useToast()

  async function handleCopyLink() {
    setIsOpen(false)
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('Channel link copied')
    } catch {
      showToast('Could not copy the link', 'error')
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Share channel"
        className="flex items-center justify-center rounded-full border border-border p-2.5 text-text-dim transition-all hover:bg-surface-2 hover:text-text active:scale-90"
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
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-text transition-colors hover:bg-surface-2"
            >
              <svg
                className="h-4 w-4 text-text-dim"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
              </svg>
              Copy channel link
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ShareMenu
