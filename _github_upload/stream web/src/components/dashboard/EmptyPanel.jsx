// حالت خالی برای تب‌هایی که هنوز محتوایی ندارن (ویدیوها/پلی‌لیست‌ها).
// آیکون پنجه‌ی گربه‌ست نه ایموجی، تا با بقیه‌ی آیکون‌های خطی سایت هم‌خانواده باشه
function PawIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="6.5" cy="9.5" rx="2.3" ry="2.9" />
      <ellipse cx="12" cy="7.3" rx="2.4" ry="3" />
      <ellipse cx="17.5" cy="9.5" rx="2.3" ry="2.9" />
      <path d="M12 12.4c3.3 0 5.7 2.4 5.7 4.8 0 2-1.8 3.5-4 3.5-1 0-1.3.3-1.7.3s-.7-.3-1.7-.3c-2.2 0-4-1.5-4-3.5 0-2.4 2.4-4.8 5.7-4.8z" />
    </svg>
  )
}

function EmptyPanel({ title, message, note }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
      <PawIcon className="h-9 w-9 text-text-dim/60" />
      <p className="font-logo text-base font-semibold text-text">{title}</p>
      <p className="max-w-xs text-sm leading-relaxed text-text-dim">{message}</p>
      {note && <p className="max-w-xs text-xs text-text-dim/70">{note}</p>}
    </div>
  )
}

export default EmptyPanel
