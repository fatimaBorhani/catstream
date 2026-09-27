import { useParams, Link } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import VideoPlayer from '../components/player/VideoPlayer'
import ChatBox from '../components/chat/ChatBox'
import StreamCard from '../components/cards/StreamCard'
import ChannelHeader from '../components/channel/ChannelHeader'
import ChannelTabs from '../components/channel/ChannelTabs'
import VideoCard from '../components/channel/VideoCard'
import ChannelPlaylists from '../components/channel/ChannelPlaylists'
import ChannelComments from '../components/channel/ChannelComments'
import ChannelAbout from '../components/channel/ChannelAbout'
import EmptyPanel from '../components/dashboard/EmptyPanel'
import useStreamStatus from '../hooks/useStreamStatus'

// فاز ۲۰: همون تابعی که StudioHeader برای uptime داره. عمداً کپی شده و مشترک نشده -
// دقیقاً به همون دلیلی که formatTimestamp بین VideoClips و ChannelClips کپی شده: برای
// دو مصرف‌کننده، ساختن یه فایل مشترک بیشتر از چیزی که حل کنه پیچیدگی اضافه می‌کرد
function formatLiveDuration(liveSince) {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(liveSince).getTime()) / (60 * 1000)),
  )
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m`
  }
  const hours = Math.floor(elapsedMinutes / 60)
  const minutes = elapsedMinutes % 60
  return `${hours}h ${minutes}m`
}

function ChannelPage() {
  // useParams مقدار قسمتی از URL که تو App.jsx با : تعریف کردیم رو بهمون می‌ده؛
  // چون مسیر رو "channel/:username" نوشتیم، اینجا username همون تیکه از آدرسه
  const { username } = useParams()
  // فاز ۳: videos و playlists دیگه از فایل mock نمیان، از همین کانتکست (که خودش از
  // دیتابیس گرفته‌شون) - بقیه‌ی این فایل دست‌نخورده می‌مونه چون شکل دیتا عیناً همونه
  const {
    streamers,
    videos,
    playlists,
    isLoading,
    getCategoryById,
    getStreamerByUsername,
    refreshData,
  } = useData()
  const streamer = getStreamerByUsername(username)
  const { user, isFollowing, toggleFollow, openAuthModal } = useAuth()
  const [activeTab, setActiveTab] = useState('live')

  // VideoPlayer خودش با ResizeObserver ارتفاع واقعیشو اندازه می‌گیره و اینجا گزارش می‌ده؛
  // useCallback تا رفرنس تابع بین رندرها ثابت بمونه و افکت داخل VideoPlayer بی‌خودی دوباره اجرا نشه
  const [videoHeight, setVideoHeight] = useState(null)
  const handleVideoHeightChange = useCallback((height) => {
    setVideoHeight(height)
  }, [])

  // فاز ۱۹: عدد واقعیِ بیننده‌ها از سوکتِ داخل ChatBox میاد (همون الگوی بالا).
  // null یعنی «هنوز خبری نرسیده» - تا اون‌موقع همون عدد seed نشون داده می‌شه، چون
  // یه صفر گذرا بدتر از یه عدد قدیمیه.
  // این state تو ChannelPage می‌مونه نه تو ChatBox، تا وقتی کاربر به تب Videos می‌ره و
  // ChatBox آنمونت می‌شه، عدد از هدر نپره
  const [liveViewerCount, setLiveViewerCount] = useState(null)
  const handleViewerCountChange = useCallback((count) => {
    setLiveViewerCount(count)
  }, [])

  // فاز ۲۳: قبلاً تا استریمر Go live/Go offline نمی‌زد، بیننده‌ای که همین صفحه رو باز
  // نگه داشته بود (چه تو حالت لایو، چه منتظرِ آفلاین) تا رفرش نمی‌کرد خبردار نمی‌شد. این
  // هوک - برخلاف سوکتِ ChatBox که فقط وقتی لایوعه وصله - همیشه (حتی تو حالت آفلاین) به
  // یه اتاق سبک وصل می‌مونه و با هر تغییر، همون refreshData ای که خودِ استریمر بعد از
  // Go live/Go offline صدا می‌زنه رو اجرا می‌کنه - یه منبع حقیقت واحد، بدون state جدا
  useStreamStatus(streamer?.id, refreshData)

  // مثل CategoryPage: تا لیست استریمرها از سرور نرسیده، زودتر از موعد "Channel not found"
  // نشون نمی‌دیم، یه اسکلتون ساده نشون می‌دیم
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-52 w-full animate-pulse rounded-2xl bg-surface-2" />
        <div className="aspect-video w-full animate-pulse rounded-lg bg-surface-2" />
      </div>
    )
  }

  if (!streamer) {
    return (
      <div>
        <p className="mb-3 text-text-dim">Channel not found.</p>
        <Link to="/" className="text-accent">
          Back to home
        </Link>
      </div>
    )
  }

  const category = getCategoryById(streamer.categoryId)
  const categoryName = category ? category.name : ''

  // عدد واقعی هر وقت رسید جای عدد seed رو می‌گیره
  const viewerCount = liveViewerCount ?? streamer.viewerCount

  // ویدیوها و پلی‌لیست‌های همین کانال - از روی username فیلتر می‌شن
  const channelVideos = videos.filter(
    (video) => video.streamerUsername === streamer.username,
  )
  const channelPlaylists = playlists.filter(
    (playlist) => playlist.streamerUsername === streamer.username,
  )
  const totalViews = channelVideos.reduce((sum, video) => sum + video.viewCount, 0)

  // بخش «پیشنهادی» - چند استریمر دیگه که الان لایو هستن (به‌جز همین یکی)
  const suggestedStreamers = streamers
    .filter((s) => s.isLive && s.id !== streamer.id)
    .slice(0, 4)

  // اگه لاگین نکرده باشی، کلیک روی فالو مودال لاگین رو باز می‌کنه نه اینکه الکی فالو کنه
  function handleFollowClick() {
    if (!user) {
      openAuthModal('login')
      return
    }
    toggleFollow(streamer.id)
  }

  return (
    <div className="flex flex-col gap-6">
      <ChannelHeader
        streamer={streamer}
        viewerCount={viewerCount}
        categoryName={categoryName}
        isFollowing={user ? isFollowing(streamer.id) : false}
        isOwnChannel={Boolean(user && streamer.userId === user.id)}
        onFollowClick={handleFollowClick}
        onAvatarClick={() => setActiveTab('about')}
      />

      <ChannelTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        videoCount={channelVideos.length}
        playlistCount={channelPlaylists.length}
      />

      {activeTab === 'live' &&
        (streamer.isLive ? (
          <div className="flex flex-col gap-6">
            {/* این ردیف فقط شامل پلیر و چته. items-start (به‌جای stretch پیش‌فرض) یعنی چت
                دیگه با محتوای ستون چپ کشیده نمی‌شه؛ ارتفاعش دقیقاً برابر با ارتفاع واقعی
                خود پلیره و با sticky، هر چقدر صفحه رو اسکرول کنی همون‌جا (زیر navbar) می‌مونه */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <VideoPlayer onHeightChange={handleVideoHeightChange} />
                <h2 className="mt-4 font-logo text-lg font-semibold text-text">
                  {streamer.streamTitle}
                </h2>
                {/* فاز ۲۰: uptime تا حالا فقط تو استودیو دیده می‌شد - یعنی خود استریمر
                    می‌دونست چقدره لایوعه ولی بیننده نه. داده‌ش (liveSince) از فاز ۴
                    آماده بود، فقط جایی نشون داده نمی‌شد */}
                <p className="mt-1 text-sm text-text-dim">
                  {categoryName} · {viewerCount.toLocaleString()} viewers
                  {streamer.liveSince && ` · live for ${formatLiveDuration(streamer.liveSince)}`}
                </p>
              </div>

              <div
                className="min-h-[300px] w-full lg:sticky lg:top-[4.5rem] lg:w-80"
                style={{ height: videoHeight ? `${videoHeight}px` : undefined }}
              >
                {/* key={streamer.id} یعنی وقتی از یه کانال به کانال دیگه می‌ریم، React یه نمونه‌ی
                    کاملاً تازه از ChatBox می‌سازه (نه اینکه همون نمونه‌ی قبلی با پیام‌های قبلی بمونه) */}
                <ChatBox
                  key={streamer.id}
                  streamerId={streamer.id}
                  onViewerCountChange={handleViewerCountChange}
                />
              </div>
            </div>

            {suggestedStreamers.length > 0 && (
              <section>
                <h2 className="mb-4 font-logo text-lg font-semibold text-text">
                  Suggested channels
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {suggestedStreamers.map((suggested) => {
                    const suggestedCategory = getCategoryById(suggested.categoryId)
                    return (
                      <StreamCard
                        key={suggested.id}
                        thumbnailImage={suggested.thumbnailImage}
                        avatarImage={suggested.avatarImage}
                        username={suggested.username}
                        streamTitle={suggested.streamTitle}
                        categoryName={suggestedCategory ? suggestedCategory.name : ''}
                        viewerCount={suggested.viewerCount}
                        isLive={suggested.isLive}
                      />
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        ) : (
          // کانال آفلاینه: به‌جای پلیر خالی، آخرین ویدیوش رو پیشنهاد می‌دیم
          <div className="flex flex-col gap-5">
            <EmptyPanel
              title={`${streamer.username} is offline`}
              message="No live stream right now. Their videos are still here."
            />
            {channelVideos.length > 0 && (
              <section>
                <h2 className="mb-4 font-logo text-lg font-semibold text-text">
                  Latest videos
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {channelVideos.slice(0, 4).map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ))}

      {activeTab === 'videos' &&
        (channelVideos.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {channelVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <EmptyPanel
            title="No videos yet"
            message="This channel hasn't published any videos."
          />
        ))}

      {activeTab === 'playlists' && (
        <ChannelPlaylists playlists={channelPlaylists} videos={videos} />
      )}

      {activeTab === 'comments' && <ChannelComments streamer={streamer} />}

      {activeTab === 'about' && (
        <ChannelAbout
          streamer={streamer}
          categoryName={categoryName}
          videoCount={channelVideos.length}
          totalViews={totalViews}
        />
      )}
    </div>
  )
}

export default ChannelPage
