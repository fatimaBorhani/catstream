import { createContext, useContext, useState, useEffect } from 'react'

// آدرس بک‌اند - فعلاً هاردکد چون هنوز رو لوکاله؛ وقتی دیپلوی کردیم این رو از یه
// متغیر محیطی (import.meta.env) می‌خونیم
const API_BASE = 'http://localhost:4000/api'

// این دیگه لاگین mock نیست: واقعاً به بک‌اند وصل می‌شیم (Express + Prisma + JWT).
// توکن تو یه کوکی httpOnly نگه داشته می‌شه (نه localStorage)، برای همین هر fetch
// باید credentials: 'include' داشته باشه تا کوکی رو با خودش بفرسته/بگیره.
const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // authModal: null (بسته) یا 'login' یا 'signup' - همون مودال با یه حالت متفاوت
  const [authModal, setAuthModal] = useState(null)
  const [authError, setAuthError] = useState('')
  // follows: آرایه‌ای از id استریمرهایی که کاربر فالو کرده - قبلاً تو localStorage بود،
  // حالا واقعاً از دیتابیس میاد (جدول Follow)، پس تا لاگین کسی معلوم نشه خالیه
  const [follows, setFollows] = useState([])
  // فاز ۱۶: likes هم دقیقاً مثل follows کار می‌کنه - آرایه‌ای از id ویدیوهایی که کاربر
  // لایک کرده. اینجا (نه تو خود دکمه) نگه داشته می‌شه چون دکمه‌ی لایک قراره چندجا
  // (صفحه‌ی تماشا، و بعداً کارت ویدیو) باشه و همه باید یه حقیقت مشترک رو ببینن
  const [likes, setLikes] = useState([])

  // فالوهای کاربر لاگین‌شده رو از سرور می‌گیره - هم موقع بالا اومدن اپ (اگه از قبل لاگین
  // بوده) هم بعد از هر لاگین/ساین‌آپ جدید صدا زده می‌شه
  async function loadFollows() {
    try {
      const response = await fetch(`${API_BASE}/follows`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setFollows(data.streamerIds)
      }
    } catch {
      // شبکه قطع بود - فالوها فعلاً خالی می‌مونن، تا بعد
    }
  }

  async function loadLikes() {
    try {
      const response = await fetch(`${API_BASE}/videos/me/likes`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setLikes(data.videoIds)
      }
    } catch {
      // عین loadFollows - شبکه قطع بود، لایک‌ها فعلاً خالی می‌مونن
    }
  }

  // موقع بالا اومدن اپ، یه بار از بک‌اند می‌پرسیم "بر اساس کوکی موجود، الان کی لاگینه؟"
  // (اگه کوکی نبود یا منقضی بود، fetch با 401 برمی‌گرده و user همون null می‌مونه)
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          // هر دو با هم و موازی، چون به هم وابسته نیستن
          await Promise.all([loadFollows(), loadLikes()])
        }
      } catch {
        // بک‌اند بالا نیست یا شبکه قطعه - یعنی کاربر مهمونه، خطا رو نشون نمی‌دیم
      }
    }
    checkSession()
  }, [])

  async function login(username, password) {
    setAuthError('')
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setAuthError(data.error || 'Login failed')
        return
      }
      setUser(data.user)
      setAuthModal(null)
      await Promise.all([loadFollows(), loadLikes()])
    } catch {
      setAuthError('Could not reach the server. Is the backend running?')
    }
  }

  async function signup({ username, email, name, password }) {
    setAuthError('')
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, name, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setAuthError(data.error || 'Signup failed')
        return
      }
      setUser(data.user)
      setAuthModal(null)
      // کاربر تازه‌ساز قطعاً هیچ فالو و لایکی نداره - نیازی به fetch نیست
      setFollows([])
      setLikes([])
    } catch {
      setAuthError('Could not reach the server. Is the backend running?')
    }
  }

  // ویرایش پروفایل (اسم/بیو/آواتار). برخلاف login و signup که خطاشون تو state مشترک
  // authError می‌شینه (چون همه‌شون تو یه مودالن)، این نتیجه رو برمی‌گردونه تا خود فرم
  // پیام موفقیت/خطا رو کنار دکمه‌ی خودش نشون بده
  async function updateProfile({ name, bio, avatarImage }) {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, bio, avatarImage }),
      })
      const data = await response.json()
      if (!response.ok) {
        return { ok: false, error: data.error || 'Could not save changes' }
      }
      // جواب سرور شامل نسخه‌ی آپدیت‌شده‌ی کاربره - همونو می‌ذاریم تو state تا کل سایت
      // (نوبار، صفحه‌ی پروفایل و...) بلافاصله آواتار/اسم جدید رو نشون بده
      setUser(data.user)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Could not reach the server. Is the backend running?' }
    }
  }

  function logout() {
    setUser(null)
    // فالوهای این کاربر رو هم پاک می‌کنیم - وگرنه تا لاگین بعدی، فالوهای همین کاربر
    // (یا خالی بودنش) رو دست‌نخورده رو صفحه می‌بینی، انگار هنوز لاگینی
    setFollows([])
    setLikes([])
    // درخواست logout رو می‌فرستیم که کوکی سمت سرور هم پاک بشه، ولی منتظرش نمی‌مونیم -
    // از دید کاربر همین که user خالی شد یعنی خارج شده
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
  }

  function openAuthModal(mode) {
    setAuthError('')
    setAuthModal(mode)
  }

  function closeAuthModal() {
    setAuthError('')
    setAuthModal(null)
  }

  // فالو/آنفالو یه استریمر. اول state رو خوش‌بینانه (optimistic) عوض می‌کنیم تا کلیک فوری
  // حس بشه، بعد درخواست واقعی رو می‌فرستیم؛ اگه سرور خطا داد، تغییر رو برمی‌گردونیم عقب
  async function toggleFollow(streamerId) {
    const wasFollowing = follows.includes(streamerId)
    setFollows((prevFollows) =>
      wasFollowing
        ? prevFollows.filter((id) => id !== streamerId)
        : [...prevFollows, streamerId],
    )

    try {
      const response = await fetch(`${API_BASE}/follows/${streamerId}`, {
        method: wasFollowing ? 'DELETE' : 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Follow request failed')
      }
    } catch {
      setFollows((prevFollows) =>
        wasFollowing
          ? [...prevFollows, streamerId]
          : prevFollows.filter((id) => id !== streamerId),
      )
    }
  }

  function isFollowing(streamerId) {
    return follows.includes(streamerId)
  }

  // فاز ۱۶: لایک/آنلایک یه ویدیو - عیناً همون الگوی خوش‌بینانه‌ی toggleFollow.
  // فرقش اینه که نتیجه رو برمی‌گردونه: دکمه‌ی لایک کنار خودش یه عدد هم نشون می‌ده و باید
  // بدونه درخواست گرفت یا نه تا اون عدد رو هم برگردونه عقب
  async function toggleLike(videoId) {
    const wasLiked = likes.includes(videoId)
    setLikes((prevLikes) =>
      wasLiked ? prevLikes.filter((id) => id !== videoId) : [...prevLikes, videoId],
    )

    try {
      const response = await fetch(`${API_BASE}/videos/${videoId}/like`, {
        method: wasLiked ? 'DELETE' : 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Like request failed')
      }
      return true
    } catch {
      setLikes((prevLikes) =>
        wasLiked ? [...prevLikes, videoId] : prevLikes.filter((id) => id !== videoId),
      )
      return false
    }
  }

  function isLiked(videoId) {
    return likes.includes(videoId)
  }

  const value = {
    user,
    login,
    signup,
    logout,
    updateProfile,
    authModal,
    openAuthModal,
    closeAuthModal,
    authError,
    follows,
    toggleFollow,
    isFollowing,
    likes,
    toggleLike,
    isLiked,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// هوک کمکی تا کامپوننت‌های دیگه راحت به state لاگین دسترسی داشته باشن
function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth باید داخل AuthProvider استفاده بشه')
  }
  return context
}

export { AuthProvider, useAuth }
