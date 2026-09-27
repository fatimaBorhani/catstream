// یه پنجره‌ی تأیید عمومی برای کارهای مهم/غیرقابل‌برگشت (مثل حذف) - همون شکل بک‌دراپ و
// کارتی که پنجره‌ی تأیید خروج تو Navbar.jsx داره، تا سراسر سایت یه حس یکسان بدن.
// دکمه‌ی تأیید هم قرمزه (نه گرادیانت accent) چون برخلاف خروج، این کار برگشت‌ناپذیره
function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl"
      >
        <h2 className="font-brand text-lg font-bold text-text">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-dim">{message}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text transition-all hover:bg-surface-2 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-red-500/20 transition-all hover:scale-[1.03] active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
