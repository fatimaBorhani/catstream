function LinkIcon({ className }) {
  return (
    <svg
      className={className}
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
  )
}

// فاز ۱۱: current همیشه از streamer.followerCount میاد (شمارش واقعیِ Follow، نه یه عدد
// دستی) - همون‌طور که تو schema.prisma توضیح داده شده، این پروژه هیچ عدد "پیشرفت" جدایی
// ذخیره نمی‌کنه که بخواد با فالو/آنفالو هماهنگ بمونه
function GoalProgress({ title, target, current }) {
  const percent = Math.min(100, Math.round((current / target) * 100))
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-logo text-base font-semibold text-text">Goal</h2>
      <p className="mt-3 text-sm leading-relaxed text-text-dim">{title}</p>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs text-text-dim">
        {current.toLocaleString()} / {target.toLocaleString()} followers
      </p>
    </div>
  )
}

// تب About: بیو، لینک‌ها، هدف کانال، و مشخصات کانال. همون چیزی که یوتیوب تو تب About نشون می‌ده
function ChannelAbout({ streamer, categoryName, videoCount, totalViews }) {
  // فاز ۱۱: socialLinks یه رشته‌ی جداشده با کاماست (عین Category.tags) - ممکنه اصلاً
  // ست نشده باشه (null) یا بعد از split یه رشته‌ی خالی وسطش باشه (مثلاً "a,,b")، برای
  // همین فیلتر می‌کنیم
  const socialLinks = streamer.socialLinks
    ? streamer.socialLinks
        .split(',')
        .map((link) => link.trim())
        .filter(Boolean)
    : []

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
        <h2 className="font-logo text-base font-semibold text-text">About</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-dim">{streamer.description}</p>

        {socialLinks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {socialLinks.map((link) => (
              <a
                key={link}
                href={`https://${link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                <LinkIcon className="h-4 w-4" />
                {link}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* یه ستون تکی که Details و (اگه کانال هدف داره) Goal توش زیر هم چیده می‌شن -
          اگه این دوتا رو مستقیم توی grid سه‌ستونه می‌ذاشتیم، Goal به‌جای زیر Details،
          می‌رفت زیر About (چون About دو ستون گرفته و Details فقط ستون سوم رو) */}
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-logo text-base font-semibold text-text">Details</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-dim">Channel ID</dt>
              <dd className="truncate text-accent">@{streamer.username.toLowerCase()}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-dim">Category</dt>
              <dd className="truncate text-text">{categoryName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-dim">Followers</dt>
              <dd className="text-text">{(streamer.followerCount ?? 0).toLocaleString()}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-dim">Videos</dt>
              <dd className="text-text">{videoCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-dim">Total views</dt>
              <dd className="text-text">{totalViews.toLocaleString()}</dd>
            </div>
            {streamer.createdAt && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-dim">Joined</dt>
                <dd className="text-text">
                  {new Date(streamer.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {streamer.goalTitle && streamer.goalTarget && (
          <GoalProgress
            title={streamer.goalTitle}
            target={streamer.goalTarget}
            current={streamer.followerCount ?? 0}
          />
        )}
      </div>
    </div>
  )
}

export default ChannelAbout
