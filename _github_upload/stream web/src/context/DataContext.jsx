import { createContext, useContext, useState, useEffect } from 'react'

// آدرس بک‌اند - عیناً همون الگوی AuthContext (فعلاً هاردکد چون رو لوکاله)
const API_BASE = 'http://localhost:4000/api'

// این کانتکست جایگزین ایمپورت مستقیم از src/data/streamers.js و categories.js شده -
// حالا این دیتا واقعاً از دیتابیس (Prisma) میاد، نه فایل mock. یه بار موقع بالا اومدن اپ
// هر دو لیست رو می‌گیریم و همه‌ی صفحه‌ها از همینجا می‌خوننش (به‌جای اینکه هرکدوم جدا fetch بزنن).
const DataContext = createContext(null)

function DataProvider({ children }) {
  const [streamers, setStreamers] = useState([])
  const [categories, setCategories] = useState([])
  // فاز ۳: قبلاً از src/data/videos.js و playlists.js میومدن، حالا مثل بقیه از دیتابیس
  const [videos, setVideos] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // فاز ۴: این تابع رو جدا از useEffect نوشتیم چون حالا از جای دیگه هم لازمش داریم - مثلاً
  // بعد از اینکه یه استریمر Go live می‌زنه یا یه ویدیو/پلی‌لیست جدید می‌سازه، باید همین
  // دوباره اجرا بشه تا این لیست‌ها (که همه‌جای سایت از همینجا خونده می‌شن) با دیتابیس هماهنگ بمونن
  async function loadData() {
    try {
      // هر چهار درخواست رو موازی می‌زنیم (نه پشت‌سرهم) چون به هم وابسته نیستن
      const [streamersRes, categoriesRes, videosRes, playlistsRes] = await Promise.all([
        fetch(`${API_BASE}/streamers`),
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/videos`),
        fetch(`${API_BASE}/playlists`),
      ])
      if (!streamersRes.ok || !categoriesRes.ok || !videosRes.ok || !playlistsRes.ok) {
        throw new Error('Failed to load data')
      }
      const streamersData = await streamersRes.json()
      const categoriesData = await categoriesRes.json()
      const videosData = await videosRes.json()
      const playlistsData = await playlistsRes.json()
      setStreamers(streamersData.streamers)
      setCategories(categoriesData.categories)
      setVideos(videosData.videos)
      setPlaylists(playlistsData.playlists)
      setLoadError('')
    } catch {
      // بک‌اند بالا نیست یا شبکه قطعه - لیست‌ها خالی می‌مونن و یه پیام خطا نشون داده می‌شه
      setLoadError('Could not reach the server. Is the backend running?')
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      await loadData()
      setIsLoading(false)
    }
    loadInitialData()
  }, [])

  // هلپرهای کوچیک پیدا کردن یه آیتم با id/username - تو چندجای فرانت (صفحه‌ی چنل و کتگوری) لازمن
  function getCategoryById(categoryId) {
    return categories.find((category) => category.id === categoryId)
  }

  function getStreamerByUsername(username) {
    return streamers.find((streamer) => streamer.username === username)
  }

  const value = {
    streamers,
    categories,
    videos,
    playlists,
    isLoading,
    loadError,
    getCategoryById,
    getStreamerByUsername,
    // فاز ۴: کامپوننت‌هایی که یه چیزی رو تو دیتابیس عوض می‌کنن (Go live، آپلود ویدیو،
    // ساخت پلی‌لیست، ویرایش اطلاعات کانال) بعد از موفقیت همینو صدا می‌زنن تا این
    // لیست‌ها بلافاصله با دیتابیس هماهنگ بشن، بدون نیاز به رفرش دستی صفحه
    refreshData: loadData,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData باید داخل DataProvider استفاده بشه')
  }
  return context
}

export { DataProvider, useData }
