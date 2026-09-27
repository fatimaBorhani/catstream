import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import StudioHeader from '../components/dashboard/StudioHeader'
import StudioActions from '../components/dashboard/StudioActions'
import DashboardNav from '../components/dashboard/DashboardNav'
import StreamInfoForm from '../components/dashboard/StreamInfoForm'
import CreateChannelForm from '../components/dashboard/CreateChannelForm'
import ProfileSettingsForm from '../components/dashboard/ProfileSettingsForm'
import ChangePasswordForm from '../components/dashboard/ChangePasswordForm'
import EmptyPanel from '../components/dashboard/EmptyPanel'
import VideoCard from '../components/channel/VideoCard'
import ChannelPlaylists from '../components/channel/ChannelPlaylists'

const API_BASE = 'http://localhost:4000/api'

function DashboardPage() {
  const { user, follows, openAuthModal } = useAuth()
  const { streamers, categories, videos, playlists, isLoading, refreshData } = useData()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('info')

  // مثل ProfilePage: بدون لاگین این صفحه معنی نداره
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-text-dim">You need to log in to manage your channel.</p>
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
      <div className="flex flex-col gap-4">
        <div className="h-20 w-full animate-pulse rounded-2xl bg-surface-2" />
        <div className="h-28 w-full animate-pulse rounded-2xl bg-surface-2" />
        <div className="h-72 w-full animate-pulse rounded-2xl bg-surface-2" />
      </div>
    )
  }

  // فاز ۱: حالا هر استریمر واقعاً با userId به صاحبش وصله، پس کانال خودِ همین کاربر رو دقیق
  // پیدا می‌کنیم - نه با حدس زدن رو یوزرنیم. اگه پیدا نشد یعنی این حساب هنوز کانالی نداره
  // (طبیعیه؛ فعلاً راهی برای "استریمر شدن" از تو سایت نیست) و همون‌جا EmptyPanel نشون داده می‌شه
  const streamer = streamers.find((s) => s.userId === user.id)

  // فاز ۳: ویدیو/پلی‌لیستِ خودِ همین کانال - عیناً همون فیلتر رو username که تو
  // ChannelPage.jsx هم هست (streamer نداشته باشیم یعنی هنوز چیزی برای فیلتر کردن نیست)
  const channelVideos = streamer
    ? videos.filter((video) => video.streamerUsername === streamer.username)
    : []
  const channelPlaylists = streamer
    ? playlists.filter((playlist) => playlist.streamerUsername === streamer.username)
    : []

  // فاز ۹: حذف یه ویدیو/پلی‌لیست از تب Videos/Playlists همین داشبورد. جفتشون یه الگو دارن -
  // درخواست DELETE بزن، لیست‌ها رو تازه کن، یه توست بده
  async function handleDeleteVideo(videoId) {
    try {
      const response = await fetch(`${API_BASE}/videos/${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        showToast('Could not delete the video', 'error')
        return
      }
      await refreshData()
      showToast('Video deleted')
    } catch {
      showToast('Could not reach the server. Is the backend running?', 'error')
    }
  }

  async function handleDeletePlaylist(playlistId) {
    try {
      const response = await fetch(`${API_BASE}/playlists/${playlistId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        showToast('Could not delete the playlist', 'error')
        return
      }
      await refreshData()
      showToast('Playlist deleted')
    } catch {
      showToast('Could not reach the server. Is the backend running?', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <StudioHeader
        user={user}
        streamer={streamer}
        followingCount={follows.length}
        onEditClick={() => setActiveTab('profile')}
      />

      <StudioActions streamer={streamer} channelVideos={channelVideos} />

      {/* pt-3 عمدیه: بدون این، ردیف تب‌ها می‌چسبید به کارت‌های بالا و به‌نظر می‌رسید
          بخشی از اوناست، نه یه بخش جدا */}
      <div className="flex flex-col gap-5 pt-6">
        <DashboardNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* فاز ۱۷: نداشتن کانال دیگه بن‌بست نیست - به‌جای پیام «No channel yet»، خودِ
            فرم ساخت کانال نشون داده می‌شه. بعد از ساخت، refreshData باعث می‌شه streamer
            پیدا بشه و همین شرط خودکار به فرم تنظیمات واقعی سوییچ کنه */}
        {activeTab === 'info' &&
          (streamer ? (
            <StreamInfoForm streamer={streamer} categories={categories} />
          ) : (
            <CreateChannelForm categories={categories} />
          ))}

        {activeTab === 'profile' && (
          <div className="flex flex-col gap-8">
            <ProfileSettingsForm />
            <div className="h-px bg-border" />
            <ChangePasswordForm />
          </div>
        )}

        {activeTab === 'videos' &&
          (!streamer ? (
            <EmptyPanel
              title="No channel yet"
              message="Create your channel from the Stream Info tab first."
            />
          ) : channelVideos.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {channelVideos.map((video) => (
                <VideoCard key={video.id} video={video} onDelete={handleDeleteVideo} />
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="No videos yet"
              message="Use the Upload video action above to publish your first one."
            />
          ))}

        {activeTab === 'playlists' &&
          (!streamer ? (
            <EmptyPanel
              title="No channel yet"
              message="Create your channel from the Stream Info tab first."
            />
          ) : (
            <ChannelPlaylists
              playlists={channelPlaylists}
              videos={videos}
              onDelete={handleDeletePlaylist}
            />
          ))}
      </div>
    </div>
  )
}

export default DashboardPage
