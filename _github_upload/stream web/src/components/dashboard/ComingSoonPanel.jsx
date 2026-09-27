// پنل جای‌گیر برای تب‌هایی که هنوز محتوای واقعی ندارن (Profile/Videos/Followers) -
// چون هرکدوم به یه دیتامدل یا زیرساخت جدا نیاز داره که هنوز نساختیمش
function ComingSoonPanel({ title, message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
      <p className="font-brand text-base font-bold text-text">{title}</p>
      <p className="max-w-xs text-sm text-text-dim">{message}</p>
    </div>
  )
}

export default ComingSoonPanel
