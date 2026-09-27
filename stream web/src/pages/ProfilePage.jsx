import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import VideoCard from '../components/channel/VideoCard'
import ChannelPlaylists from '../components/channel/ChannelPlaylists'
import EmptyPanel from '../components/dashboard/EmptyPanel'

function ProfilePage() {
  const { user, follows, openAuthModal } = useAuth()
  const { streamers, videos, playlists, isLoading } = useData()
  // فقط وقتی معنی داره که کاربر خودش صاحب یه کانال باشه - چون یه کاربر معمولی
  // اصلاً ویدیو/پلی‌لیست نداره که تبش رو نشون بدیم
  const [contentTab, setContentTab] = useState('videos')

  // اگه لاگین نکرده باشی این صفحه معنی نداره - به‌جای ریدایرکت (که تو یه سایت mock
  // پیچیدگی اضافه‌ست)، یه پیام ساده با دکمه‌ی باز کردن مودال لاگین نشون می‌دیم
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-text-dim">You need to log in to see your profile.</p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="rounded-md bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.03] active:scale-95"
        >
          Log In
        </button>
      </div>
    )
  }

  const followedStreamers = streamers.filter((streamer) => follows.includes(streamer.id))
  const liveFollowedCount = followedStreamers.filter((streamer) => streamer.isLive).length

  // createdAt رو بک‌اند برمی‌گردونه (sanitizeUser همه‌ی فیلدها جز پسورد رو می‌فرسته)، ولی
  // محض احتیاط چک می‌کنیم باشه - اگه نبود کلاً این ردیف رو نشون نمی‌دیم
  const memberSinceYear = user.createdAt ? new Date(user.createdAt).getFullYear() : null

  // فاز ۹: اگه این کاربر خودش صاحب یه کانال باشه، ویدیو/پلی‌لیست‌هاش رو همین‌جا هم نشون می‌دیم.
  // این فقط نمایشیه (بدون دکمه‌ی حذف) - برای مدیریت واقعی (آپلود/حذف) باید بری داشبورد
  const streamer = streamers.find((s) => s.userId === user.id)
  const channelVideos = streamer
    ? videos.filter((video) => video.streamerUsername === streamer.username)
    : []
  const channelPlaylists = streamer
    ? playlists.filter((playlist) => playlist.streamerUsername === streamer.username)
    : []

  return (
    // بدون کانال، ستون دومی نیست که کنارش وایسه - برای همین کارت رو وسط‌چین می‌کنیم
    // (وگرنه چسبیده به لبه‌ی چپ با یه فضای خالی گنده کنارش بد به‌نظر می‌رسید).
    // با کانال، برمی‌گردیم به همون چیدمان دوستونه‌ی قبلی: کارت چپ، محتوا راست
    <div className={streamer ? 'flex flex-col gap-6 lg:flex-row lg:items-start' : 'mx-auto w-full max-w-sm'}>
      <div
        className={
          streamer
            ? 'w-full shrink-0 overflow-hidden rounded-xl border border-border bg-surface lg:w-72'
            : 'w-full overflow-hidden rounded-xl border border-border bg-surface'
        }
      >
        {/* نوار بنر - همون گرادیانتی که تو پنل برندینگ مودال لاگین (AuthModal) استفاده شده،
            رنگ جدید نیست. relative فقط برای هاله‌ی محو داخلشه */}
        <div className="relative h-24 overflow-hidden bg-gradient-to-br from-[#1b2a4d] to-[#0d1424]">
          <div className="pointer-events-none absolute left-6 -top-8 h-32 w-32 rounded-full bg-accent/40 blur-2xl" />
        </div>

        <div className="px-5 pb-5 text-center">
          {/* relative + z-10: بنر بالا position:relative داره، پس بدون این، بنر روی آواتار
              می‌افتاد و نصف دایره زیرش گم می‌شد */}
          <img
            src={user.avatarImage}
            alt={user.username}
            className="relative z-10 -mt-12 h-24 w-24 rounded-full border-4 border-surface bg-surface-2 object-cover"
          />
          <h1 className="mt-3 font-brand text-xl font-bold text-text">{user.username}</h1>
          {user.name && <p className="mt-0.5 truncate text-sm text-text-dim">{user.name}</p>}
          {user.email && <p className="truncate text-xs text-text-dim">{user.email}</p>}
          {/* بیو - چیزی که تو تب Profile داشبورد نوشتی. truncate نداره چون باید کامل خونده بشه */}
          {user.bio && <p className="mt-3 text-sm leading-relaxed text-text-dim">{user.bio}</p>}

          <div className="my-4 h-px bg-border" />

          {/* کل ردیف لینکه به /following - همونجایی که لیست کامل رو می‌بینی */}
          <Link
            to="/following"
            className="flex items-center justify-between rounded-lg px-0.5 py-2 transition-colors hover:bg-surface-2"
          >
            <span className="text-sm text-text-dim">Following</span>
            <span className="font-brand text-base font-bold text-text">
              {isLoading ? '…' : followedStreamers.length}
            </span>
          </Link>
          <div className="flex items-center justify-between px-0.5 py-2">
            <span className="text-sm text-text-dim">Live now</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-online" />
              <span className="font-brand text-base font-bold text-online">
                {isLoading ? '…' : liveFollowedCount}
              </span>
            </span>
          </div>
          {memberSinceYear && (
            <div className="flex items-center justify-between px-0.5 py-2">
              <span className="text-sm text-text-dim">Member since</span>
              <span className="text-sm text-text">{memberSinceYear}</span>
            </div>
          )}

          {/* فعلاً ویرایش پروفایل جای خودش تو پنل استریمره، پس این دکمه می‌بردت اونجا -
              همونجا هم می‌شه ویدیو/پلی‌لیست آپلود کرد، هم حذفشون کرد */}
          <Link
            to="/dashboard"
            className="mt-4 block rounded-lg bg-gradient-to-r from-accent to-accent-2 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/25 transition-transform hover:scale-[1.02] active:scale-95"
          >
            Edit profile
          </Link>
        </div>
      </div>

      {/* فقط وقتی کانال داری این ستون نشون داده می‌شه - یه کاربر معمولی چیزی برای نشون دادن نداره */}
      {streamer && (
        <section className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-brand text-lg font-bold text-text">Your channel content</h2>

            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => setContentTab('videos')}
                className={
                  contentTab === 'videos'
                    ? 'rounded-full bg-gradient-to-r from-accent to-accent-2 px-3.5 py-1.5 text-xs font-semibold text-white'
                    : 'rounded-full bg-surface-2 px-3.5 py-1.5 text-xs font-medium text-text-dim transition-colors hover:text-text'
                }
              >
                Videos
              </button>
              <button
                type="button"
                onClick={() => setContentTab('playlists')}
                className={
                  contentTab === 'playlists'
                    ? 'rounded-full bg-gradient-to-r from-accent to-accent-2 px-3.5 py-1.5 text-xs font-semibold text-white'
                    : 'rounded-full bg-surface-2 px-3.5 py-1.5 text-xs font-medium text-text-dim transition-colors hover:text-text'
                }
              >
                Playlists
              </button>
            </div>
          </div>

          {contentTab === 'videos' ? (
            channelVideos.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {channelVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <EmptyPanel
                title="No videos yet"
                message="Upload one from your dashboard and it'll show up here."
              />
            )
          ) : (
            <ChannelPlaylists playlists={channelPlaylists} videos={videos} />
          )}
        </section>
      )}
    </div>
  )
}

export default ProfilePage
