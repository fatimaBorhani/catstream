import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { useData } from '../../context/DataContext'

const API_BASE = 'http://localhost:4000/api'

// اگه کاربر لینک تامبنیل نذاره، یه باکس رنگی ساده مثل بقیه‌ی ویدیوهای seed شده می‌ذاریم
const DEFAULT_THUMBNAIL = 'https://placehold.co/640x360/1e293b/1e293b'

// چون این یه دموعه نه یه سرویس واقعی، سقفی رو حجم فایل می‌ذاریم که دیسک سرور پر نشه -
// همین عدد تو سرور (server/src/routes/videos.js) هم تکرار شده؛ اینجا فقط برای این‌که
// پیام خطا زودتر (قبل از فرستادن کل فایل به سرور) نشون داده بشه
const MAX_VIDEO_MB = 200

// فاز آپلود واقعی: مدت‌زمان ویدیو رو دیگه کاربر تایپ نمی‌کنه، از خودِ فایل می‌خونیمش.
// یه تگ ویدیوی نامرئی می‌سازیم، فایل رو بهش می‌دیم، صبر می‌کنیم متادیتاش (که شامل مدت‌زمانه)
// لود بشه، بعد URL موقتی که براش ساختیم رو آزاد می‌کنیم که حافظه هدر نره
function readVideoDurationSeconds(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const probeElement = document.createElement('video')
    probeElement.preload = 'metadata'
    probeElement.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(probeElement.duration)
    }
    probeElement.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('COULD_NOT_READ_FILE'))
    }
    probeElement.src = objectUrl
  })
}

// «۹۲ ثانیه» رو به شکل خوانای «۱:۳۲» درمیاره - فقط برای پیش‌نمایش زیر اینپوت فایل،
// چیزی که رو دیتابیس ذخیره می‌شه همیشه دقیقه‌ی گردشده‌ست (سرور اینو می‌خواد)
function formatPreviewDuration(totalSeconds) {
  const rounded = Math.round(totalSeconds)
  const minutes = Math.floor(rounded / 60)
  const seconds = rounded % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

// فاز ۴ + فاز آپلود واقعی: فرم آپلود ویدیو. قبلاً مدت‌زمان رو کاربر با دست تایپ می‌کرد
// چون سایت جایی برای نگه‌داری فایل واقعی نداشت - حالا خودِ فایل واقعاً آپلود و رو دیسک
// سرور ذخیره می‌شه (server/src/routes/videos.js) و مدت‌زمان از خودِ فایل خونده می‌شه
function UploadVideoForm({ onCancel, onSaved }) {
  const [title, setTitle] = useState('')
  const [thumbnailImage, setThumbnailImage] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [durationSeconds, setDurationSeconds] = useState(null)
  const [error, setError] = useState('')
  const [isReadingFile, setIsReadingFile] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()
  const { refreshData } = useData()

  async function handleFileChange(event) {
    const file = event.target.files[0]
    setError('')
    setVideoFile(null)
    setDurationSeconds(null)
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('File must be a video')
      event.target.value = ''
      return
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`Video must be ${MAX_VIDEO_MB}MB or smaller`)
      event.target.value = ''
      return
    }

    setIsReadingFile(true)
    try {
      const seconds = await readVideoDurationSeconds(file)
      setVideoFile(file)
      setDurationSeconds(seconds)
    } catch {
      setError('Could not read this video file - try a different one')
      event.target.value = ''
    } finally {
      setIsReadingFile(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!videoFile || durationSeconds === null) {
      setError('Choose a video file first')
      return
    }

    setIsSaving(true)
    try {
      // FormData نه JSON، چون داریم یه فایل واقعی می‌فرستیم نه فقط متن. Content-Type رو
      // عمداً دستی ست نمی‌کنیم - خودِ مرورگر boundary درستشو می‌سازه
      const formData = new FormData()
      formData.append('title', title)
      formData.append('thumbnailImage', thumbnailImage.trim() || DEFAULT_THUMBNAIL)
      // ثانیه‌های واقعی فایل رو به دقیقه‌ی گردشده‌ی رو به بالا تبدیل می‌کنیم - یه ویدیوی
      // ۹۰ ثانیه‌ای باید ۲ دقیقه حساب بشه، نه صفر
      formData.append('durationMinutes', String(Math.max(1, Math.ceil(durationSeconds / 60))))
      formData.append('video', videoFile)

      const response = await fetch(`${API_BASE}/videos`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Could not publish the video')
        return
      }
      await refreshData()
      showToast('Video published')
      onSaved()
    } catch {
      setError('Could not reach the server. Is the backend running?')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-2 p-5"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">Title</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">Thumbnail URL (optional)</span>
        <input
          type="text"
          value={thumbnailImage}
          onChange={(event) => setThumbnailImage(event.target.value)}
          placeholder={DEFAULT_THUMBNAIL}
          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-dim outline-none transition-colors focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">
          Video file (max {MAX_VIDEO_MB}MB)
        </span>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          required
          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-dim outline-none transition-colors file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-accent-2"
        />
        {isReadingFile && <span className="text-xs text-text-dim">Reading file...</span>}
        {videoFile && durationSeconds !== null && (
          <span className="text-xs text-text-dim">
            {videoFile.name} · {formatPreviewDuration(durationSeconds)}
          </span>
        )}
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-dim transition-colors hover:text-text"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || isReadingFile}
          className="rounded-lg bg-gradient-to-r from-accent to-accent-2 px-5 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {isSaving ? 'Uploading...' : 'Publish'}
        </button>
      </div>
    </form>
  )
}

export default UploadVideoForm
