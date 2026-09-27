import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'

const API_BASE = 'http://localhost:4000/api'

// صفحه‌ی پروفایل عمومیِ یه کاربر دیگه (نه خودت) - وقتی زیر یه کامنت رو اسم/آواتار
// یکی کلیک می‌کنی میای اینجا. برخلاف ProfilePage.jsx (که پروفایل خودتو با /auth/me
// نشون می‌ده)، این از /api/users/:username می‌گیره که email و بقیه‌ی چیزهای خصوصی نداره
function PublicProfilePage() {
  const { username } = useParams()
  const { streamers } = useData()
  const [profileUser, setProfileUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function loadProfile() {
      setIsLoading(true)
      setNotFound(false)
      try {
        const response = await fetch(`${API_BASE}/users/${username}`)
        if (isCancelled) return
        if (!response.ok) {
          setNotFound(true)
          setProfileUser(null)
          return
        }
        const data = await response.json()
        setProfileUser(data.user)
      } catch {
        if (!isCancelled) setNotFound(true)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadProfile()
    // اگه قبل از تموم شدن fetch، کاربر رفت یه یوزرنیم دیگه رو باز کرد، جواب کهنه رو
    // نادیده می‌گیریم - وگرنه ممکنه پروفایل غلط لحظه‌ای فلش بزنه
    return () => {
      isCancelled = true
    }
  }, [username])

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <div className="h-64 w-full animate-pulse rounded-xl bg-surface-2" />
      </div>
    )
  }

  if (notFound || !profileUser) {
    return (
      <div>
        <p className="mb-3 text-text-dim">User not found.</p>
        <Link to="/" className="text-accent">
          Back to home
        </Link>
      </div>
    )
  }

  // اگه این کاربر خودش صاحب یه کاناله، لینک "Visit channel" نشونش می‌دیم - از streamers
  // که از قبل تو DataContext لود شده، نیازی به یه fetch جدا نیست
  const matchingStreamer = streamers.find(
    (streamer) => streamer.username === profileUser.username,
  )
  const memberSinceYear = profileUser.createdAt
    ? new Date(profileUser.createdAt).getFullYear()
    : null

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="w-full overflow-hidden rounded-xl border border-border bg-surface">
        <div className="relative h-24 overflow-hidden bg-gradient-to-br from-[#1b2a4d] to-[#0d1424]">
          <div className="pointer-events-none absolute left-6 -top-8 h-32 w-32 rounded-full bg-accent/40 blur-2xl" />
        </div>

        <div className="px-5 pb-5 text-center">
          <img
            src={profileUser.avatarImage}
            alt={profileUser.username}
            className="relative z-10 -mt-12 h-24 w-24 rounded-full border-4 border-surface bg-surface-2 object-cover"
          />
          <h1 className="mt-3 font-brand text-xl font-bold text-text">
            {profileUser.username}
          </h1>
          {profileUser.name && (
            <p className="mt-0.5 truncate text-sm text-text-dim">{profileUser.name}</p>
          )}
          {profileUser.bio && (
            <p className="mt-3 text-sm leading-relaxed text-text-dim">{profileUser.bio}</p>
          )}

          {memberSinceYear && (
            <>
              <div className="my-4 h-px bg-border" />
              <div className="flex items-center justify-between px-0.5 py-2">
                <span className="text-sm text-text-dim">Member since</span>
                <span className="text-sm text-text">{memberSinceYear}</span>
              </div>
            </>
          )}

          {matchingStreamer && (
            <Link
              to={`/channel/${matchingStreamer.username}`}
              className="mt-4 block rounded-lg bg-gradient-to-r from-accent to-accent-2 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/25 transition-transform hover:scale-[1.02] active:scale-95"
            >
              Visit channel
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default PublicProfilePage
