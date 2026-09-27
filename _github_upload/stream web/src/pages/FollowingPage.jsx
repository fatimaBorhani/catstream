import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import StreamCard from '../components/cards/StreamCard'
import StreamCardSkeleton from '../components/cards/StreamCardSkeleton'
import EmptyPanel from '../components/dashboard/EmptyPanel'

const SKELETON_COUNT = 4

// همیشه لایوها بالای آفلاین‌ها، داخل هر گروه هم پربیننده‌ترها بالاتر - عین همون
// مرتب‌سازی تو Sidebar.jsx، تا رفتار همه‌جای سایت یکی باشه
function sortByLiveThenViewers(streamerList) {
  return [...streamerList].sort((a, b) => {
    if (a.isLive !== b.isLive) {
      return a.isLive ? -1 : 1
    }
    return b.viewerCount - a.viewerCount
  })
}

// فاز ۸: قبلاً فالوها فقط تو سایدبار (خلاصه، چندتای اول) دیده می‌شدن. این صفحه‌ی جدا
// همه‌ی کانال‌هایی که کاربر فالو کرده رو با همون کارت بزرگ BrowsePage نشون می‌ده
function FollowingPage() {
  const { user, follows, openAuthModal, toggleFollow } = useAuth()
  const { streamers, categories, isLoading, refreshData } = useData()
  const { showToast } = useToast()

  // تا حالا آنفالو کردن فقط از تو خودِ صفحه‌ی کانال ممکن بود - یعنی برای برداشتن یه
  // کانال از این لیست، باید اول می‌رفتی توش. حالا از همینجا هم می‌شه.
  // بعدش refreshData صدا زده می‌شه چون تعداد فالوورِ اون کانال (فاز ۱۱) عوض شده و
  // بقیه‌ی سایت باید عدد تازه رو ببینه
  async function handleUnfollow(streamer) {
    await toggleFollow(streamer.id)
    await refreshData()
    showToast(`Unfollowed ${streamer.username}`)
  }

  // مثل DashboardPage: بدون لاگین، «فالو» اصلاً معنی نداره
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-text-dim">Log in to see the channels you follow.</p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.03] active:scale-95"
        >
          Log In
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <StreamCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  const followedStreamers = sortByLiveThenViewers(
    streamers.filter((streamer) => follows.includes(streamer.id)),
  )

  return (
    <div>
      <h2 className="mb-4 font-brand text-lg font-bold text-text">Following</h2>

      {followedStreamers.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {followedStreamers.map((streamer) => {
            const category = categories.find((c) => c.id === streamer.categoryId)
            return (
              // دکمه بیرون و زیر کارت می‌شینه نه روش: خودِ StreamCard یه لینک تمام‌سطحه،
              // و یه دکمه‌ی روی اون یعنی جنگیدن با کلیک لینک
              <div key={streamer.id} className="flex flex-col gap-2">
                <StreamCard
                  thumbnailImage={streamer.thumbnailImage}
                  avatarImage={streamer.avatarImage}
                  username={streamer.username}
                  streamTitle={streamer.streamTitle}
                  categoryName={category ? category.name : ''}
                  viewerCount={streamer.viewerCount}
                  isLive={streamer.isLive}
                />
                <button
                  type="button"
                  onClick={() => handleUnfollow(streamer)}
                  className="self-start rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-dim transition-colors hover:border-accent hover:text-accent"
                >
                  Unfollow
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyPanel
          title="Not following anyone yet"
          message="Follow a few channels and they'll show up here."
        />
      )}

      {followedStreamers.length > 0 && (
        <p className="mt-6 text-center text-sm text-text-dim">
          Looking for more?{' '}
          <Link to="/browse" className="text-accent hover:underline">
            Browse channels
          </Link>
        </p>
      )}
    </div>
  )
}

export default FollowingPage
