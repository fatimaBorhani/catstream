import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import PlayerControls from './PlayerControls'

// چون سرور استریم واقعی نداریم، یه فایل MP4 تستی رو به‌صورت loop پخش می‌کنیم
// تا حس یه استریم زنده رو بده
const TEST_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4'

function VideoPlayer({ onHeightChange }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(false)

  // مرورگر راه‌های مختلفی برای خروج از حالت تمام‌صفحه داره (دکمه‌ی Esc، دکمه‌ی خود مرورگر و...)
  // نه فقط دکمه‌ی خودمون؛ برای همین گوش می‌دیم به رویداد fullscreenchange تا state هماهنگ بمونه
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // به کامپوننت پدر (صفحه‌ی چنل) خبر می‌دیم ارتفاع واقعی پلیر (که فقط بر اساس aspect-video
  // و عرض خودش حساب می‌شه) چقدره، تا بتونه چت رو دقیقاً هم‌قد همین باکس بکنه.
  // چون این ref مستقیم روی خودِ باکس aspect-video ئه (نه یه wrapper بیرونی که ممکنه با
  // flex-stretch بزرگ بشه)، عددی که می‌گیریم همیشه ارتفاع واقعی و پایدار ویدیوعه.
  // useLayoutEffect (نه useEffect) چون می‌خوایم همون اولین رندر، قبل از پینت، یه اندازه‌ی
  // درست داشته باشیم - وگرنه یه لحظه چت با ارتفاع پیش‌فرض/غلط نشون داده می‌شه تا ResizeObserver
  // اولین callback خودش رو صدا بزنه (که می‌تونه یکی-دو فریم طول بکشه).
  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element || !onHeightChange) return

    onHeightChange(element.getBoundingClientRect().height)
  }, [onHeightChange])

  // بعد از اندازه‌گیری اولیه، با ResizeObserver هر تغییر بعدی (مثلاً resize شدن پنجره،
  // که عرض و در نتیجه ارتفاع aspect-video رو عوض می‌کنه) رو هم دنبال می‌کنیم
  useEffect(() => {
    const element = containerRef.current
    if (!element || !onHeightChange) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        onHeightChange(entry.contentRect.height)
      }
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [onHeightChange])

  function togglePlay() {
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  function toggleMute() {
    const nextMuted = !isMuted
    videoRef.current.muted = nextMuted
    setIsMuted(nextMuted)
  }

  function handleVolumeChange(newVolume) {
    videoRef.current.volume = newVolume
    videoRef.current.muted = newVolume === 0
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-lg bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* videoRef رو مستقیم به عنصر <video> وصل می‌کنیم تا از بیرون (دکمه‌های کنترل)
          بتونیم play/pause/volume رو صدا بزنیم، بدون نیاز به state واسطه برای خود پخش */}
      <video
        ref={videoRef}
        src={TEST_VIDEO_URL}
        className="h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-online/90 px-2 py-1 text-xs font-bold uppercase tracking-wide text-bg">
        <span className="h-1.5 w-1.5 rounded-full bg-bg" />
        Live
      </span>

      <PlayerControls
        isPlaying={isPlaying}
        isMuted={isMuted}
        volume={volume}
        isFullscreen={isFullscreen}
        showControls={showControls}
        onTogglePlay={togglePlay}
        onToggleMute={toggleMute}
        onVolumeChange={handleVolumeChange}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  )
}

export default VideoPlayer
