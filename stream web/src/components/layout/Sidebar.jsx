import { Link } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import SidebarChannelItem from '../cards/SidebarChannelItem'
import SidebarChannelItemSkeleton from '../cards/SidebarChannelItemSkeleton'

// همیشه لایوها بالای آفلاین‌ها، و داخل هر گروه پربیننده‌ترها بالاتر.
// (کپی جدا می‌گیریم چون sort آرایه‌ی اصلی رو تغییر می‌ده)
function sortByLiveThenViewers(streamerList) {
  return [...streamerList].sort((a, b) => {
    if (a.isLive !== b.isLive) {
      return a.isLive ? -1 : 1
    }
    return b.viewerCount - a.viewerCount
  })
}

function Sidebar({ isOpen, onClose }) {
  const { user, follows } = useAuth()
  const { streamers, categories, isLoading } = useData()

  // منطق سایدبار به لاگین بودن یا نبودن بستگی داره:
  // - مهمون: هیچ فالویی نداره، پس فقط محبوب‌ترین‌ها رو می‌بینه
  // - لاگین‌کرده: اول کانال‌هایی که خودش فالو کرده، بعد بقیه به‌عنوان پیشنهاد
  const followedStreamers = user
    ? sortByLiveThenViewers(streamers.filter((streamer) => follows.includes(streamer.id)))
    : []
  const otherStreamers = sortByLiveThenViewers(
    streamers.filter((streamer) => !followedStreamers.includes(streamer)),
  )

  function renderChannelItem(streamer) {
    const category = categories.find((c) => c.id === streamer.categoryId)
    return (
      <SidebarChannelItem
        key={streamer.id}
        avatarImage={streamer.avatarImage}
        username={streamer.username}
        categoryName={category ? category.name : ''}
        viewerCount={streamer.viewerCount}
        isLive={streamer.isLive}
      />
    )
  }

  // بسته که باشه اصلاً رندر نمی‌شه و محتوای صفحه کل عرض رو می‌گیره
  if (!isOpen) return null

  return (
    <>
      {/* فقط رو موبایل: یه پرده‌ی تیره پشت منو که با کلیک روش بسته می‌شه.
          رو موبایل سایدبار روی محتوا میاد (fixed)، چون عرض صفحه برای کنار هم بودنشون کافی نیست */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="fixed inset-0 top-14 z-30 bg-black/60 md:hidden"
      />

      <aside className="fixed bottom-0 left-0 top-14 z-40 w-60 shrink-0 overflow-y-auto border-r border-border bg-surface px-3 py-4 md:static md:z-auto md:h-auto">
      {isLoading ? (
        <>
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-text-dim">
            Channels
          </p>
          <div className="flex flex-col gap-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <SidebarChannelItemSkeleton key={index} />
            ))}
          </div>
        </>
      ) : (
        <>
          {followedStreamers.length > 0 && (
            <>
              {/* فاز ۸: قبلاً این فقط یه عنوان ثابت بود؛ حالا لینکه به /following چون
                  اینجا فقط چندتای اول رو نشون می‌ده، صفحه‌ی جدا همه‌شون رو داره */}
              <Link
                to="/following"
                className="mb-3 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-text-dim transition-colors hover:text-text"
              >
                Following
              </Link>
              <div className="mb-5 flex flex-col gap-1">
                {followedStreamers.map(renderChannelItem)}
              </div>
            </>
          )}

          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-text-dim">
            Most Popular
          </p>
          <div className="flex flex-col gap-1">{otherStreamers.map(renderChannelItem)}</div>
        </>
      )}
      </aside>
    </>
  )
}

export default Sidebar
